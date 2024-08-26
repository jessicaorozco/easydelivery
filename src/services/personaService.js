const Persona = require('../models/personaSchema');
const { MongoClient, ObjectId } = require('mongodb');
const userService = require('../services/userService');
require('dotenv').config();

const createPersona = async (req, res) => {
  const client = await MongoClient.connect(
    process.env.URI
  );
    try {
      await client.connect();
      const newPerson = new Persona(req.body);
      const coll = client.db('easyDb').collection('persona');
      const usuario = client.db('easyDb').collection('user');
      const result = await coll.insertOne(newPerson);
      const newUser = ({
       email:req.body.vEmail,
       password:"generic1234"

      })
      await usuario.insertOne(newUser);
      console.log(`New person inserted with ID: ${result.insertedId}`);
      res.status(201).json({ message: 'Person created successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }finally{
      await client.close();
    }

};

const getPersonaById = async (req, res) => {
  const client = await MongoClient.connect(process.env.URI);
  try {
    const personId = req.params.id;
    const db = client.db('easyDb');
    const collection = db.collection('persona');
    const filter = { _id: new ObjectId(personId) }; 
    const persona = await collection.findOne(filter);

    if (!persona) {
      return res.status(404).json({ message: 'Person not found' });
    }

    res.status(200).json(persona);

  } catch (error) {
    console.error('Error fetching persom:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await client?.close();
  }
};

const getAllPersonas = async (req, res) => {
  const client = await MongoClient.connect(
    process.env.URI
  );
        try {
          await client.connect();
          const filter = {};
          const persons = client.db('easyDb').collection('persona');
          const cursor = persons.find(filter);
          const data = await cursor.toArray();
          res.status(200).json(data);
        } catch (err) {
            res.status(500).send({
                message:
                    err.message || "Error al realizar la búsqueda"
            });
        }finally{
          await client?.close();
        }

};

const updatePersona = async (req, res) => {
  const client = await MongoClient.connect(
    process.env.URI
  );
try {
await client.connect();
const db = client.db('easyDb'); 
const collection = db.collection('company');
const personId = req.params._id; 
const updatedPerson = req.body;
const filter = { _id: new ObjectId(personId) }; 
await collection.findOneAndUpdate(
  filter,
  { $set: updatedPerson },
  { returnDocument: 'after' } 
);
res.status(200).json({ message: 'Person updated successfully' });
} catch (error) {
console.error(error);
res.status(500).json({ error: 'Internal server error' });
} finally {
await client?.close(); 
}







  const PersonaId = req.params.id;
  const updatedPersona = req.body;
  try {
    const Persona = await Persona.findByIdAndUpdate(PersonaId, updatedPersona, { new: true });
    if (!Persona) {
      return res.status(404).json({ message: 'Persona not found' });
    }
    res.status(200).json(Persona);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deletePersona = async (req, res) => {
  const client = await MongoClient.connect(
    process.env.URI
  );
  try {
    await client.connect();
    const db = client.db('easyDb'); 
    const persons = db.collection('iso');
    const personId = req.params.id; 
    const filter = { _id: new ObjectId(personId) }; 
    await persons.findOneAndDelete(filter);
    res.status(200).json({ message: 'Person deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPersona,
  getPersonaById,
  getAllPersonas,
  updatePersona,
  deletePersona,
};
