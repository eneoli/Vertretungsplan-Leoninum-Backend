import express from 'express';
import * as bodyParser from 'body-parser';
import {routes} from './Routes';

const app: express = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({type: 'application/json'}));
app.use('/', express.static('static'));

routes(app);

const port: string | number = process.env.PORT || 3000;

app.listen(port);

console.log('Vertretungsplan Leoninum RESTful API started on port  ' + port);