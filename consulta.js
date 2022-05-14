const {Pool} = require("pg")

// Conexion con la base de datos
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    password: "**********",
    database: "bancosolar",
    port: 5432
})

// ---------------------------------------------------------------------------------------------------------------

// Insertar usuarios y balances 
const insertar = async(datos) => {
    const query = {
        text: "INSERT INTO usuarios (nombre, balance) VALUES ($1, $2) RETURNING *",
        values: datos
    }
    const client = await pool.connect()

    try {
       const result = await client.query(query)
       return {
           ok: true,
           data: result.rows
       }

   } catch (error) {
       console.log(error);
       return {
           ok: false,
           data: "error en DB"
       }
   } finally {
       //console.log("llego al finally");
       client.release()
   }
}

// --------------------------------------------------------------------------------------------------------

// Leer usuarios
const leer = async() => {
    const client = await pool.connect()

    try {
        const result = await client.query("SELECT * FROM usuarios")
        return {
            ok: true,
            data: result.rows
        }

    } catch (error) {
        console.log(error);
        return {
            ok: false,
            data: "error en DB"
        }
    } finally {
        //console.log("llego al finally");
        client.release()
    }
 }

// --------------------------------------------------------------------------------------------------------

// Actualizar registro de usuarios
const actualizar = async(datos,id) => {
    datos.push(id)
    const query = {
        text: "UPDATE usuarios SET nombre = $1, balance = $2 WHERE id = $3 RETURNING *",
        values: datos
    }
    const client = await pool.connect()

    try {
       const result = await client.query(query)
       return {
           ok: true,
           data: result.rows
       }

   } catch (error) {
       console.log(error);
       return {
           ok: false,
           data: "error en DB"
       }
   } finally {
       //console.log("llego al finally");
       client.release()
   }
}
// ---------------------------------------------------------------------------------------------

// Eliminar registro de usuarios
const eliminar = async (id) => { 
    const query = { 
        text: `DELETE FROM usuarios WHERE id = $1 RETURNING*`, 
        values: id
    }; 
 
    const client = await pool.connect(); 
    try { 
        const result = await client.query(query); 
        return { 
            ok: true, 
            data: result.rows, 
        }; 
    } catch (error) { 
        console.log(error); 
        return { 
            ok: false, 
            data: "Error en DB", 
        }; 
    } finally { 
        client.release(); 
    } 
};

// ------------------------------------------------------------------------------------------------

// Ejecutar transacciones
const registroTransacion = async(emisor, receptor, monto) => {

    const client = await pool.connect()

    const queryEmisor = {
        text: "SELECT * FROM usuarios WHERE nombre = $1",
        values: [emisor]
    }
    const queryReceptor = {
        text: "SELECT * FROM usuarios WHERE nombre = $1",
        values: [receptor]
    }

    
    try {
        
        await client.query('BEGIN;')

        const { id: idEmisor } = (
            await client.query(queryEmisor)).rows[0];

        const { id: idReceptor } = (
            await client.query(queryReceptor)).rows[0];

        const fechaRaw = await client.query("SELECT TO_CHAR(NOW(), 'YYYY/MM/DD HH:MM:SS');")
        const fecha = fechaRaw.rows[0].to_char

            const queryInsert = {
                text: "INSERT INTO transferencias (emisor,receptor,monto,fecha) VALUES ($1, $2, $3, $4) RETURNING*",
                values: [idEmisor, idReceptor, monto, fecha]
            }

            const queryBalanceEmisor = {
                text: "UPDATE usuarios SET balance = balance - $2 WHERE nombre = $1",
                values: [emisor, monto]
            }

            const queryBalanceReceptor = {
                text: "UPDATE usuarios SET balance = balance + $2 WHERE nombre = $1",
                values: [receptor, monto]
            }

        await client.query(queryInsert)
        await client.query(queryBalanceEmisor)
        await client.query(queryBalanceReceptor)


        await client.query('COMMIT;')

        
        return { 
            ok: true, 
            data: 'transaccion exitosa', 
        };
    } catch (error) {

        await client.query('ROLLBACK;')
        console.log(error);
        return { 
            ok: false, 
            data: 'transaccion fallida', 
        };
        
    } finally {
        client.release()
        console.log('Libre Soy');
    }
}

// ------------------------------------------------------------------------------------------------------

// Leer el registro de Transacciones
const leerTransacciones = async() => {
    const client = await pool.connect()

    const selectTransferencias = {
        text: "SELECT * FROM transferencias",
        rowMode: "array"
    }

    try {
        const result = await client.query(selectTransferencias)
        return {
            ok: true,
            data: result.rows
        }

    } catch (error) {
        console.log(error);
        return {
            ok: false,
            data: "error en DB"
        }
    } finally {
        console.log("llego al finally");
        client.release()
    }
 }


module.exports = {insertar, leer, actualizar, eliminar, registroTransacion, leerTransacciones}