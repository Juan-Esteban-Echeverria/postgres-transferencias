const http = require("http")
const fs = require("fs")
const url = require("url")
const {insertar, leer, actualizar, eliminar, registroTransacion, leerTransacciones} = require("./consulta.js")


const server = http.createServer(async(req,res) => {

    // GET: Devuelve la aplicación cliente disponible en el apoyo de la prueba
    if(req.url == "/" && req.method == "GET"){
        res.setHeader("content-type", "text/html")
        const html = fs.readFileSync("index.html", "utf8")
        res.end(html)
    }


    // usuario POST: Recibe los datos de un nuevo usuario y los almacena en PostgreSQL.
    if(req.url == "/usuario" && req.method == "POST"){
        let body = ""
        req.on("data", (chunk) => {
            body+= chunk
        })
        req.on("end", async()=>{
            const datos = Object.values(JSON.parse(body))
            const respuesta = await insertar(datos)
            res.end(JSON.stringify(respuesta))
        })
    }


    // usuarios GET: Devuelve todos los usuarios registrados con sus balances.
    if(req.url == "/usuarios" && req.method == "GET"){
        const registros = await leer()
        res.end(JSON.stringify(registros.data))
    }


    // usuario PUT: Recibe los datos modificados de un usuario registrado y los actualiza.
    if(req.url.includes("/usuario") && req.method == "PUT"){
        let { id } = url.parse(req.url, true).query;
        let body = ""
        req.on("data", (chunk) => {
            body+= chunk
        })
        req.on("end", async()=>{
            const datos = Object.values(JSON.parse(body))
            const respuesta = await actualizar(datos,id)
            res.end(JSON.stringify(respuesta))
        })
    }


    // usuario DELETE: Recibe el id de un usuario registrado y lo elimina
    if(req.url.includes("/usuario") && req.method == "DELETE"){
        const {id} = url.parse(req.url, true).query
        const result = await eliminar([id]); 
 
    if (!result.ok) {
        res.writeHead(500, { "Content-Type": "application/json" }); 
        return res.end(JSON.stringify(result)); 
    } 
 
    if (result.data.length === 0) { 
        res.writeHead(403, { "Content-Type": "application/json" }); 
        return res.end( 
            JSON.stringify({ ok: false, data: "no existe el id" }) 
        ); 
    } 
        res.writeHead(200, { "Content-Type": "application/json" }); 
        res.end(JSON.stringify(result.data)); 
    }


    // transferencia POST: Recibe los datos para realizar una nueva transferencia
    if(req.url == "/transferencia" && req.method == "POST"){
        let body = ""
        req.on("data", (chunk) => {
            body+= chunk
        })

        req.on("end", async()=>{
        const { emisor, receptor, monto } = JSON.parse(body);

        const data = await registroTransacion(
            emisor,
            receptor,
            monto,
        );

        res.writeHead(data.ok ? 200 : 400, {
            "Content-Type": "application/json",
        });

        res.end(JSON.stringify(data.data));

    })
    }


    // transferencias GET: Devuelve todas las transferencias almacenadas en la base de datos en formato de arreglo.
    if(req.url == "/transferencias" && req.method == "GET"){
        const registros = await leerTransacciones()
        res.end(JSON.stringify(registros.data))
    }


})

server.listen(3000, () => console.log("Server On"))