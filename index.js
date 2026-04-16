const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const supabase = createClient(
  'https://hjxuqoltkpbmsjuzkute.supabase.co',
  'sb_publishable_wZYAl8s-32NHWBOns-o0IA_0QE3raWN' // paste your publishable key here
);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const path = require('path');
app.use(express.static(path.join(__dirname)));

app.get('/todos', async (req, res) => {
  const { data, error } = await supabase.from('todos').select('*');
  if (error) return res.status(500).send(error);
  res.send(data);
});

app.post('/todos', async (req, res) => {
  const { data, error } = await supabase
    .from('todos')
    .insert([{ text: req.body.todo }])
    .select();
  if (error) return res.status(500).send(error);
  res.send({ message: 'Todo added!', todo: data[0] });
});

app.delete('/todos/:id', async (req, res) => {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).send(error);
  res.send({ message: 'Todo deleted!' });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
