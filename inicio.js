var http = require('http');
var url = require('url');
var fs = require('fs');
var querystring = require('querystring');
var mysql = require('mysql');
var Stylecss = 
'<meta charset="utf-8">'+
'<!-- Estilos de  Bootstrap -->' +
'<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet"' +
'integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">' +
'<!-- Latest compiled and minified CSS -->' +
'<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"' +
'integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">' +
'<!-- Optional theme -->' +
'<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css"' +
'integrity="sha384-rHyoN1iRsVXV4nD0JutlnGaslCJuC7uwjduW9SVrLvRYooPp2bWYgmgJQIXwl/Sp" crossorigin="anonymous">' +
'<!-- Estilos por defecto -->' +
'<link rel="stylesheet" href="/css/styles.css">';

var conexion = mysql.createConnection({
	host: 'localhost',
	port: '3306',
	user: 'root',
	password: 'administrador',
	database: 'practica6'
});

conexion.connect(function (error) {
	if (error)
		console.log('Problemas de conexion con mysql ' + error.message);
	else
		console.log('Conexion con Mysql');

});

var mime = {
	'html': 'text/html',
	'css': 'text/css',
	'jpg': 'image/jpg',
	'ico': 'image/x-icon',
	'mp3': 'audio/mpeg3',
	'mp4': 'video/mp4'
};

var servidor = http.createServer(function (pedido, respuesta) {
	var objetourl = url.parse(pedido.url);
	var camino = 'public' + objetourl.pathname;
	if (camino == 'public/')
		camino = 'public/index.html';
	encaminar(pedido, respuesta, camino);
});

servidor.listen(3000);

function encaminar(pedido, respuesta, camino) {

	switch (camino) {
		case 'public/creartabla': {
			crear(respuesta);
			break;
		}
		case 'public/alta': {
			alta(pedido, respuesta);
			break;
		}
		case 'public/listado': {
			listado(respuesta);
			break;
		}
		case 'public/consultaporcodigo': {
			consulta(pedido, respuesta);
			break;
		}
		default: {
			fs.exists(camino, function (existe) {
				if (existe) {
					fs.readFile(camino, function (error, contenido) {
						if (error) {
							respuesta.writeHead(500, { 'Content-Type': 'text/plain' });
							respuesta.write('Error interno');
							respuesta.end();
						} else {
							var vec = camino.split('.');
							var extension = vec[vec.length - 1];
							var mimearchivo = mime[extension];
							respuesta.writeHead(200, { 'Content-Type': mimearchivo });
							respuesta.write(contenido);
							respuesta.end();
						}
					});
				} else {
					respuesta.writeHead(404, { 'Content-Type': 'text/html' });
					respuesta.write('<!doctype html><html><head>'+Stylecss+'</head><body>Recurso inexistente</body></html>');
					respuesta.end();
				}
			});
		}
	}
}

function crear(respuesta) {
	conexion.query('drop table if exists articulos', function (error, resultado) {
		if (error)
			console.log(error);
	});
	conexion.query('create table articulos (' +
		'codigo int primary key auto_increment,' +
		'descripcion varchar(50),' +
		'precio float' +
		')', function (error, resultado) {
			if (error) {
				console.log(error);
				return;
			}
		});
	respuesta.writeHead(200, { 'Content-Type': 'text/html' });
	respuesta.write('<!doctype html><html><head>'+Stylecss+'</head><body><br><center><p id="mensaje">'+
		'Se creo la tabla</p><a type="button" class="btn btn-info mt-4" href="index.html"> Retornar</a></center></body></html>');
	respuesta.end();
}

function alta(pedido, respuesta) {
	var info = '';
	pedido.on('data', function (datosparciales) {
		info += datosparciales;
	});
	pedido.on('end', function () {
		var formulario = querystring.parse(info);
		var registro = {
			descripcion: formulario['descripcion'],
			precio: formulario['precio']
		};
		conexion.query('insert into articulos set ?', registro, function (error, resultado) {
			if (error) {
				console.log(error);
				return;
			}
		});
		respuesta.writeHead(200, { 'Content-Type': 'text/html' });
		respuesta.write('<!doctype html><html><head>'+Stylecss+'</head><body><br><center><p id="mensaje">'+
			'Se cargo el articulo</p><a type="button" class="btn btn-info mt-4" href="index.html" >Retornar</a><center></body></html>');
		respuesta.end();
	});
}

function listado(respuesta) {
	conexion.query('select codigo,descripcion,precio from articulos', function (error, filas) {
		if (error) {
			console.log('error en el listado');
			return;
		}
		respuesta.writeHead(200, { 'Content-Type': 'text/html' });
		var datos = '';
		for (var f = 0; f < filas.length; f++) {
			datos += 'Codigo: ' + filas[f].codigo + '<br>';
			datos += 'Descripcion: ' + filas[f].descripcion + '<br>';
			datos += 'Precio: ' + filas[f].precio + '<hr>';
		}
		respuesta.write('<!doctype html><html><head>'+Stylecss+'<link rel="stylesheet" href="/css/stylesLista.css"></head><body><br><p>');
		respuesta.write(datos);
		respuesta.write('</p><a type="button" class="btn btn-info mt-4" href="index.html" >Retornar</a>');
		respuesta.write('</body></html>');
		respuesta.end();
	});
}

function consulta(pedido, respuesta) {
	var info = '';
	pedido.on('data', function (datosparciales) {
		info += datosparciales;
	});
	pedido.on('end', function () {
		var formulario = querystring.parse(info);
		var dato = [formulario['codigo']];
		conexion.query('select descripcion,precio from articulos where codigo=?', dato, function (error, filas) {
			if (error) {
				console.log('error en la consulta');
				return;
			}
			respuesta.writeHead(200, { 'Content-Type': 'text/html' });
			var datos = '';
			if (filas.length > 0) {
				datos += 'Descripcion:' + filas[0].descripcion + '<br>';
				datos += 'Precio:' + filas[0].precio + '<hr>';
			} else {
				datos = '<br> <p id="mensaje"> No existe un artículo con dicho codigo.</p>';
			}
			respuesta.write('<!doctype html><html><head>'+Stylecss+'<link rel="stylesheet" href="/css/stylesLista.css"></head><body><br><p>');
			respuesta.write(datos);
			respuesta.write('</p><a type="button" class="btn btn-info mt-4" href="index.html">Retornar</a>');
			respuesta.write('</body></html>');
			respuesta.end();
		});

	});

}

console.log('Servidor web iniciado: 3000 ');