import 'dotenv/config';
import './discord';
import { app } from './app';

const portArgv = process.argv.findIndex((param) => param === '--p');
let port = 3000;
if (portArgv !== -1) {
  if (!process.argv[portArgv + 1]) throw new Error('Missing port');
  else {
    let portValue = Number(process.argv[portArgv + 1]);
    if (isNaN(portValue)) portValue = 3000;

    port = portValue;
  }
}

app.listen(port, () => console.log('App is listening on port:', port));
