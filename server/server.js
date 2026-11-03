/** ---------- SYSTEM ---------- **/
require('dotenv').config();
const express = require('express');
const app = express();
const SITE_URL = process.env.SITE_URL || ' http://localhost';
const PORT = process.env.PORT || 5000;

/** ---------- MIDDLEWARE ---------- **/
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('build'));

/** ---------- EXPRESS ROUTES ---------- **/

/** ---------- START SERVER ---------- **/
app.listen(PORT, () => {
    console.log(`Server is Active - ${SITE_URL}:${PORT}`);
});