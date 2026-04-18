const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const supabase = createClient(
  'https://hjxuqoltkpbmsjuzkute.supabase.co',
  'sb_publishable_wZYAl8s-32NHWBOns-o0IA_0QE3raWN' // paste your publishable key here
);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.static(path.join(__dirname)));

// GET all todos — ordered by position
app.get('/todos', async (req, res) => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .order('position', { ascending: true });
  if (error) return res.status(500).send(error);
  res.send(data);
});

// POST a new todo
app.post('/todos', async (req, res) => {
  const { text, due_date, priority, tags } = req.body;

  // Put new todos at the end
  const { data: maxRow } = await supabase
    .from('todos')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const nextPosition = (maxRow?.position || 0) + 1;

  const { data, error } = await supabase
    .from('todos')
    .insert([{
      text: text || req.body.todo, // backward compatible with old `todo` key
      due_date: due_date || null,
      priority: priority || 'medium',
      tags: tags || [],
      position: nextPosition,
      completed: false,
    }])
    .select();

  if (error) return res.status(500).send(error);
  res.send({ message: 'Todo added!', todo: data[0] });
});

// PATCH — update any field(s) of a todo
app.patch('/todos/:id', async (req, res) => {
  const allowed = ['text', 'completed', 'due_date', 'priority', 'tags', 'position'];
  const updates = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }

  const { data, error } = await supabase
    .from('todos')
    .update(updates)
    .eq('id', req.params.id)
    .select();

  if (error) return res.status(500).send(error);
  res.send({ message: 'Todo updated!', todo: data[0] });
});

// POST reorder — accepts array of {id, position}
app.post('/todos/reorder', async (req, res) => {
  const { order } = req.body; // [{id, position}, ...]
  if (!Array.isArray(order)) {
    return res.status(400).send({ error: 'order must be an array' });
  }

  try {
    await Promise.all(
      order.map(({ id, position }) =>
        supabase.from('todos').update({ position }).eq('id', id)
      )
    );
    res.send({ message: 'Reordered!' });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// DELETE a todo
app.delete('/todos/:id', async (req, res) => {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).send(error);
  res.send({ message: 'Todo deleted!' });
});

// DELETE all completed
app.delete('/todos/completed/all', async (req, res) => {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('completed', true);
  if (error) return res.status(500).send(error);
  res.send({ message: 'Completed todos cleared!' });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});