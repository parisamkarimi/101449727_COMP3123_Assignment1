const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const employeeSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: String,
  position: String,
  salary: Number,
  date_of_joining: { type: Date, default: Date.now },
  department: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Employee = mongoose.model('Employee', employeeSchema);

app.post('/api/v1/user/signup', [
  check('username').notEmpty().withMessage('Username is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, email, password: hashedPassword });
  
  try {
    const savedUser = await newUser.save();
    res.status(201).json({ message: 'User created successfully.', user_id: savedUser._id });
  } catch (error) {
    res.status(400).json({ message: 'Error creating user.', error });
  }
});

app.post('/api/v1/user/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user._id }, 'jwt_secret', { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful.', jwt_token: token });
  } else {
    res.status(401).json({ status: false, message: 'Invalid Username and password' });
  }
});

app.get('/api/v1/emp/employees', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees.', error });
  }
});

app.post('/api/v1/emp/employees', async (req, res) => {
  const { first_name, last_name, email, position, salary, date_of_joining, department } = req.body;
  const newEmployee = new Employee({ first_name, last_name, email, position, salary, date_of_joining, department });
  
  try {
    const savedEmployee = await newEmployee.save();
    res.status(201).json({ message: 'Employee created successfully.', employee_id: savedEmployee._id });
  } catch (error) {
    res.status(400).json({ message: 'Error creating employee.', error });
  }
});

app.get('/api/v1/emp/employees/:eid', async (req, res) => {
  const { eid } = req.params;
  try {
    const employee = await Employee.findById(eid);
    if (employee) {
      res.status(200).json(employee);
    } else {
      res.status(404).json({ message: 'Employee not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee details.', error });
  }
});

app.put('/api/v1/emp/employees/:eid', async (req, res) => {
  const { eid } = req.params;
  const updates = req.body;
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(eid, updates, { new: true });
    if (updatedEmployee) {
      res.status(200).json({ message: 'Employee details updated successfully.' });
    } else {
      res.status(404).json({ message: 'Employee not found.' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error updating employee.', error });
  }
});

app.delete('/api/v1/emp/employees', async (req, res) => {
  const { eid } = req.query;
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(eid);
    if (deletedEmployee) {
      res.status(204).json({ message: 'Employee deleted successfully.' });
    } else {
      res.status(404).json({ message: 'Employee not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting employee.', error });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});