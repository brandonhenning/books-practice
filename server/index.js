const express = require('express')
const app = express()
const port = 5000 || process.env.PORT
const fetch = require('node-fetch')
const URL = 'https://www.googleapis.com/books/v1/volumes?q=origin'
const db = require('./database/databaseFunctions')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const log = console.log

app.use(cors())
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'client/build')));

db.createTables()

async function checkUser (email, password) {
    const user = await db.authenticateUser(email, password)
    return user
}

app.get('/:email/:password', async (request, response) => {
    try {
        const user = await checkUser(request.params.email, request.params.password)
        if (user) {
            return response.json({ user })
        } else {
            const user = await db.createUser(request.params.email, request.params.password)
            const newUser = await checkUser(request.params.email, request.params.password)
            return response.json({ newUser })
        }
    } catch (error) {log('Error validating or creating user', error)}
})

// Route for user to delete their account
app.delete('/delete/:email/:password', async (request, response) => {
    const { email, password } = request.params
    try {
        const user = await checkUser(email, password)
        if (user) {
            await db.deleteUser(email, password)
            return response.json({ msg: `User ${email} successfully deleted.` })
        } else return response.json({ msg: 'User note deleted yet' })
    } catch (error) { 
        log ('Error deleteing user', error)
    } return response.json({ msg: 'Error deleting user' })
})

// Route for user to edit their password
app.patch('/edit-password/:email/:password/:newPassword', async (request, response) => {
    const { email, password, newPassword } = request.params
    try {
        const user = await checkUser(email, password)
        console.log(user)
        if (user) {
            await db.updatePassword(email, password, newPassword)
            return response.json({ msg: `Password for account ${email} successfully updated.` })
        } else return response.json({ msg: 'Password not successfully updated.' })
    } catch (error) {
        log('Error updating user password', error)
    } return response.json( {msg: 'Error updating password'} )
})

// Route to get books by collectionID
app.get('/:collectionID', async (request, response) => {
    const { collectionID } = request.params
    try {
        const booksCollection = await db.getBooksFromCollection(collectionID)
        if (booksCollection) {
            return response.json({ booksCollection })
        } else {
            return response.json({ mgs: `No books found in collection for ID# ${collectionID}.` })
        }
    } catch (error) {log('Error retrieving bookc collection', error)}
})


app.listen(port, () => {
    console.log(`Listening on ${port}`)
})

