import { Hono } from 'hono';
import { google, Auth, sheets_v4 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

type GOOGLE_CRED = {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GOOGLE_REFRESH_TOKEN: string
  GOOGLE_SPREADSHEET_ID: string
}

type Bindings = {
  expense: any
}

const app = new Hono<{ Bindings: Bindings }>()
// const app = new Hono()

app.post('/webhook', async (c) => {
  const update = await c.req.json();
  
  if (update.message && update.message.text) {
    const chatId = update.message.chat.id;
    const messageText = update.message.text;

    // Periksa apakah pesan merupakan perintah
    if (messageText.startsWith('/')) {
      const [command, ...args] = messageText.split(' ');
      const argsText = args.join(' '); // Gabungkan kembali argumen menjadi satu string
      // Tangani perintah sesuai kebutuhan
      switch (command) {
        case '/start':
          await sendMessage(chatId, 'Selamat datang! Bot siap digunakan.');
          break;
        case '/help':
          await sendMessage(chatId, 'Berikut adalah daftar perintah yang tersedia: expense');
          break;
        case '/expense':
          // Pisahkan deskripsi dan jumlah berdasarkan tanda ':'
          const [description, amount] = argsText.split(':').map((part: string) => part.trim());

          if (description && amount) {
            // Lakukan parsing jumlah menjadi angka
            const amountNumber = parseFloat(amount.replace(/,/g, '')); // Menghapus koma jika ada

            if (!isNaN(amountNumber)) {
              const { keys } = await c.env.expense.list();
              const keyNames = keys.map((key: any) => key.name);
              const valuesArray = await Promise.all(
                keyNames.map(async (key: any) => {
                  const value = await c.env.expense.get(key);
                  return { [key]: value };
                })
              );
              const values = Object.assign({}, ...valuesArray);
              // Lanjutkan dengan logika penanganan yang sesuai
              await appendExpense(values, chatId, description, amountNumber);
            } else {
              await sendMessage(chatId, 'Format jumlah tidak valid. Pastikan Anda memasukkan angka yang benar.');
            }
          } else {
            await sendMessage(chatId, 'Format perintah tidak lengkap. Gunakan format: /expense deskripsi:jumlah');
          }
          break;
        // Tambahkan penanganan perintah lain di sini
        default:
          await sendMessage(chatId, `Perintah tidak dikenal: ${command}`);
      }
    } else {
      // Tangani pesan yang bukan perintah
      await sendMessage(chatId, 'Pesan Anda diterima.');
    }

  }
  return c.json({ status: 'received' });
});

async function sendMessage(chatId: number, text: string) {
  const token = '7511161449:AAHtU_-ma4Jg1ofShWRO9UAi5yrIPZ8WYBA';
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text }),
  });
  return res.json();
}

function getAuthenticatedClient(cred: GOOGLE_CRED, chatId: number): Auth.OAuth2Client {

  if (!cred.GOOGLE_CLIENT_ID || !cred.GOOGLE_CLIENT_SECRET || !cred.GOOGLE_REFRESH_TOKEN) {
    // throw new Error('Missing required environment variables');
    sendMessage(chatId, 'Missing required environment variables');
  }

  const oauth2Client = new google.auth.OAuth2(
    cred.GOOGLE_CLIENT_ID,
    cred.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: cred.GOOGLE_REFRESH_TOKEN,
  });

  return oauth2Client;
}

async function appendExpense(cred: GOOGLE_CRED, chatId: number, description: string, amount: number): Promise<void> {
  const auth: OAuth2Client = getAuthenticatedClient(cred, chatId);
  const sheets: sheets_v4.Sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId: string = cred.GOOGLE_SPREADSHEET_ID || '';
  const sheetName: string = 'Cost Detail'; // Adjust the sheet name as needed

  try {
    // Retrieve the current data to determine the last row
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`, // Assuming column A has data
    });

    const numRows = getResponse.data.values ? getResponse.data.values.length : 0;
    const nextRow = numRows + 1;

    // Prepare the data to append
    const values: (string | number)[][] = [
      [getDate(), '', '', description, amount],
    ];

    const resource: sheets_v4.Params$Resource$Spreadsheets$Values$Append['requestBody'] = {
      values,
    };

    // Append the data to the sheet
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A${nextRow}:E${nextRow}`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: resource,
    });

    const updatedCells = appendResponse.data.updates?.updatedCells || 0;
    console.log(`${updatedCells} cells appended.`);
    await sendMessage(chatId, `Pengeluaran dicatat:\nDeskripsi: ${description}\nJumlah: Rp${amount.toLocaleString('id-ID')}`);
  } catch (error) {
    console.error('Error appending data to spreadsheet:', error);
    await sendMessage(chatId, `Error appending data to spreadsheet: ${error}`);
  }
}

function getDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();

  const formattedToday = dd.toString().padStart(2, '0') + '/' + mm.toString().padStart(2, '0') + '/' + yyyy;
  return formattedToday;
}


export default app
