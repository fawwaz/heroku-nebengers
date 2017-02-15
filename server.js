var express 	= require('express');
var app 		= express();
var cors		= require('cors');
var bodyParser 	= require('body-parser');
var morgan		= require('morgan');
var axios		= require('axios');
var nebengers 	= require('./nebengers');
var path		= require('path');

var jwt			= require('jsonwebtoken');
var config		= require('./config');

var port		= process.env.PORT || 8080;
app.set('secretkey',config.secret);

app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());

app.use(morgan('dev'));
app.use(cors());

app.get('/static/bundle.js',function(req,res){
	res.sendFile(path.join(__dirname)+'/static/bundle.js');
});

app.get('/', function(req, res){
	// res.send('Hello! The API is at http://localhost:' + port + '/api');
	res.sendFile(path.join(__dirname + '/index.html'));
});

// API routes
var apiRoutes = express.Router();

apiRoutes.post('/authenticate', function(req, res) {
	var email 		= req.body.email;
	var password	= req.body.password;

	// Hardcode dulu untuk login, next time dipisah jadi package sendiri..
	var user = {
		email: email,
		password: password
	};

	nebengers.login(user, function(response){
		
		if(response.code == "20" ){
			
			var jwttoken = jwt.sign({
				token: response.result.token
			},app.get('secretkey'));

			res.json({
				success: true,
				message: 'Success',
				token : jwttoken,
				user: response.result.user
			});

		}else{
			res.json({ success: false, message: 'Failed to authenticate on nebengers server', result:null});
		}

	}, function(error){
		res.json({ success: false, message: 'Failed while authenticating to nebengers server', result:error});
	});
});

apiRoutes.use(function(req, res, next){

	var token = req.body.token || req.query.token || req.headers['x-access-token'];

	if(token){
		
		jwt.verify(token, app.get('secretkey'), function(err, decoded) {      
			
			if (err) {
				return res.json({ success: false, message: 'Failed to authenticate token.' , error:err});    
			} else {
				// if everything is good, save to request for use in other routes
				req.decoded = decoded;    
				next();
			}

    	});

	}else{
		return res.status(403).send({ 
			success: false, 
			message: 'No token provided.' 
		});
	}
});

apiRoutes.get('/',function(req, res){
	return res.json({ success: true, message: 'You successfully pass the token ! '+JSON.stringify(req.decoded) });    
});

apiRoutes.get('/ride/:ride_id', function(req, res){
	var token = req.decoded.token;
	var filter = req.query;

	filter.token = token;
	filter.ride_id = req.params.ride_id;

	nebengers.ride_detail(filter, function(response){
		res.json({ success: true, message: response.message, result:response.result});
	}, function(error){
		res.json({ success: false, message: "Failed getting ride id", result:error});
	});
});

apiRoutes.get('/ride',function(req, res){
	var token 	= req.decoded.token;
	var filter 	= req.query;
	
	filter.token = token;
	
	nebengers.explore(filter,function(response){
		res.json({ success: true, message: response.message, result:response.result});
	}, function(error) {
		res.json({ success: false, message: "Failed getting all list of ride", result:error});
	});
});

apiRoutes.get('/create_ride_request',function(req, res){
	var token 	= req.decoded.token;
	var params	= req.query;

	params.token = token;

	nebengers.create_request(params, function(response){
		res.json({ success: true, message: response.message, result:response.result});
	}, function(error){
		res.json({ success: false, message: "Failed getting all list of ride", result:error});
	});
});

apiRoutes.get('/ride_request/:ride_id', function(req, res){
	var token 	= req.decoded.token;
	var filter 	= req.query;

	filter.token = token;
	filter.ride_id = req.params.ride_id;

	nebengers.ride_request(filter, function(response){
		res.json({ success: true, message: response.message, result:response.result});
	}, function(error){
		res.json({ success: false, message: "Failed getting all list of ride", result:error});
	});
})

app.use('/api', apiRoutes);


app.listen(port);

console.log('Magic happens at http://localhost:' + port);