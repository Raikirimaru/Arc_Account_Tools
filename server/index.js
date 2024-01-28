import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { google } from 'googleapis'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import { dirname } from 'path'
import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import clientRoutes from './routes/clients.js'
import invoiceRoutes from './routes/invoices.js'
import userRoutes from './routes/userRoutes.js'

import pdfTemplate from './documents/index.js'
import profile from './routes/profile.js'
// import invoiceTemplate from './documents/invoice.js'
import emailTemplate from './documents/email.js'

const app = express()
dotenv.config()

app.use((express.json({ limit: "30mb", extended: true})))
app.use((express.urlencoded({ limit: "30mb", extended: true})))
app.use((cors({
    origin: ["*", "https://arcaccount.netlify.app"],
    method: ["PUT", "HEAD", "POST", "GET", "DELETE"],
    credentials: true,
})))

app.use('/invoices', invoiceRoutes)
app.use('/clients', clientRoutes)
app.use('/users', userRoutes)
app.use('/profiles', profile)

/*POPULATE BELOW FIELDS WITH YOUR CREDETIALS*/

const ID = process.env.CLIENT_ID
const SECRET = process.env.CLIENT_SECRET
const TOKEN = process.env.REFRESH_TOKEN
const RESTRICTED = process.env.REDIRECT_URI
const MAIL = process.env.SMTP_USER
const AUTH = process.env.AUTH_TYPE
const PASS = process.env.SMTP_PASS
const SERVICE_MAIL = process.env.MAILER_SERVICE
const SECURE = process.env.SMTP_SECURE

/*POPULATE ABOVE FIELDS WITH YOUR CREDETIALS*/

const oAuth2Client = new google.auth.OAuth2(
    ID,
    SECRET,
    RESTRICTED
);

oAuth2Client.setCredentials({ refresh_token: TOKEN })
const ACCESS_TOKEN = await oAuth2Client.getAccessToken()

// NODEMAILER TRANSPORT FOR SENDING INVOICE VIA EMAIL
const transporter = nodemailer.createTransport({
    sendMail: true,
    service: SERVICE_MAIL,
    secure: SECURE,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        type: AUTH,
        clientId: ID,
        clientSecret: SECRET,
    },
    tls: {
        rejectUnauthorized: true
    },
    debug: true
})

// SEND PDF INVOICE VIA EMAIL
app.post('/send-pdf', cors(), async (req, res) => {
    const { email, company } = req.body;

    try {
        // Launch Puppeteer browser
        const browser = await puppeteer.launch({
            ignoreDefaultArgs: ['--disable-extensions'],
        });
        const page = await browser.newPage();

        // Use req.body to generate the HTML content dynamically
        const content = pdfTemplate(req.body);

        // Set the HTML content of the page
        await page.setContent(content);

        // Generate the PDF
        await page.pdf({
            path: 'invoice.pdf',
            format: 'A4',
            printBackground: true,
        });

        // Close the Puppeteer browser
        await browser.close();
        // Send email with defined transport object
        transporter.sendMail({
            from: `${company.email}`,
            to: `${email}`,
            replyTo: `${company.email}`,
            subject: `Invoice from ${company.businessName ? company.businessName : company.name}`,
            text: `Invoice from ${company.businessName ? company.businessName : company.name}`,
            html: emailTemplate(req.body),
            auth: {
                user: MAIL,
                pass: PASS,
                refreshToken: TOKEN,
                accessToken: ACCESS_TOKEN,
            },
            attachments: [{
                filename: 'invoice.pdf',
                path: `${__dirname}/invoice.pdf`
            }]
        });

        console.log('PDF sent via email successfully');
        res.send('PDF sent via email successfully');
    } catch (error) {
        // If there's an error during PDF generation, email sending, or Puppeteer operations
        console.error('Error sending PDF via email:', error.message);
        res.status(500).send('Error sending PDF via email');
    }
});

//Problems downloading and sending invoice
// npm install puppeteer

//CREATE AND SEND PDF INVOICE
app.post('/create-pdf', cors(), async (req, res) => {
    try {
        const browser = await puppeteer.launch();

        const page = await browser.newPage();

        const content = pdfTemplate(req.body);

        await page.setContent(content);

        await page.pdf({
            path: 'invoice.pdf',
            format: 'A4',
            printBackground: true,
        });

        await browser.close();
        res.send('PDF created successfully');
    } catch (error) {
        console.error('Error generating PDF:', error.message);
        res.status(500).send('Error generating PDF');
    }
});

//SEND PDF INVOICE
app.get('/fetch-pdf', cors() , (req, res) => {
    res.sendFile(`${__dirname}/invoice.pdf`)
})


app.get('/', (req, res) => {
    res.send('SERVER IS RUNNING')
})

const DB_URL = process.env.DB_URL
const PORT = process.env.PORT || 5000

mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => app.listen(PORT, () => console.log(`Server running on port: ${PORT}`)))
    .catch((error) => console.log(error.message))

mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)
