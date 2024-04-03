const express = require('express');
const mysql = require('mysql');
const cors = require('cors'); 

const app = express();
const port = 9000;

app.use(cors({
    origin: 'http://localhost:8100'
})); 

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    port: '3308',
    password: '',
    database: 'horario_universitario'
});

connection.connect((err) => {
    if (err) {
        console.error('Error de conexión a la base de datos: ', err);
        return;
    }
    console.log('Conexión a la base de datos establecida');
});

app.get('/horarios', (req, res) => {
    const query = 'SELECT * FROM horarios';
    connection.query(query, (error, results) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            res.status(500).send('Error del servidor');
            return;
        }
        res.json(results);
    });
});

function obtenerDatos(callback) {
    connection.query('SELECT * FROM cursos JOIN profesores ON cursos.id_profesor = profesores.id_profesor JOIN aulas ON cursos.id_aula = aulas.id_aula;', (error, results, fields) => {
      if (error) {
        console.error('Error al obtener los datos: ' + error.stack);
        return;
      }
      callback(results);
    });
}

function sumarHoras(hora, horasASumar) {
    // Convertir la hora a un objeto Date
    const horaObjeto = new Date('2024-01-01 ' + hora);
    
    // Sumar las horas
    horaObjeto.setHours(horaObjeto.getHours() + horasASumar);

    // Obtener la nueva hora en formato HH:MM:SS
    const nuevaHora = horaObjeto.toLocaleTimeString('en-US', { hour12: false });

    return nuevaHora;
}

function generarHorario() {
    obtenerDatos((datos) => {
      const horario = {}; // Objeto para almacenar el horario generado
      
      // Iterar sobre cada curso obtenido de la base de datos
      datos.forEach(curso => {
        const { id_curso, nombre_curso, nombre_profesor, nombre_aula, dia_semana, hora_inicio, hora_fin } = curso;
        
        // Verificar si ya hay un curso asignado para el mismo día y hora
        if (!horario[dia_semana]) {
          horario[dia_semana] = {};
        }
        if (!horario[dia_semana][hora_inicio]) {
          // Asignar el curso al horario y aula específicos
          horario[dia_semana][hora_inicio] = {
            curso: nombre_curso,
            profesor: nombre_profesor,
            aula: nombre_aula,
            hora_fin: hora_fin
          };
        } else {
          // Si ya hay un curso asignado para esa hora, intentar asignarlo a la siguiente hora disponible
          let nuevaHoraInicio = sumarHoras(hora_inicio, 1); // Suponiendo una función para sumar horas
          while (horario[dia_semana][nuevaHoraInicio]) {
            nuevaHoraInicio = sumarHoras(nuevaHoraInicio, 1);
          }
          // Asignar el curso a la nueva hora y aula
          horario[dia_semana][nuevaHoraInicio] = {
            curso: nombre_curso,
            profesor: nombre_profesor,
            aula: nombre_aula,
            hora_fin: hora_fin
          };
        }
      });
  
      console.log('Horario generado:', horario);
      // Llamar a la función para guardar el horario en la base de datos
      guardarHorarioEnDB(horario);
    });
}

function guardarHorarioEnDB(horario) {
    // Iterar sobre cada día de la semana en el horario
    Object.keys(horario).forEach(dia => {
        // Iterar sobre cada hora del día en el horario
        Object.keys(horario[dia]).forEach(hora => {
            // Obtener los detalles del curso en esa hora
            const { curso, profesor, aula, hora_fin } = horario[dia][hora];
            // Insertar el curso en la tabla de horarios
            const sql = `INSERT INTO horarios (id_curso, id_profesor, id_aula, dia_semana, hora_inicio, hora_fin) VALUES (?, ?, ?, ?, ?, ?)`;
            // Ejecutar la consulta SQL
            connection.query(sql, [curso, profesor, aula, dia, hora, hora_fin], (error, results, fields) => {
                if (error) {
                    console.error('Error al insertar el curso en la tabla de horarios:', error);
                } else {
                    console.log('Curso insertado en la tabla de horarios:', curso);
                }
            });
        });
    });
}

// Después de llamar a generarHorario()
generarHorario();

app.listen(port, () => {
    console.log(`Servidor backend en http://localhost:${port}`);
});

