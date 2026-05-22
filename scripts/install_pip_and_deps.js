import { execSync } from 'child_process';
import fs from 'fs';
import https from 'https';

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function run() {
  try {
    console.log('Downloading get-pip.py...');
    await downloadFile('https://bootstrap.pypa.io/get-pip.py', './get-pip.py');
    console.log('✓ get-pip.py downloaded!');

    console.log('Bootstrapping pip for python3...');
    execSync('python3 get-pip.py --user --quiet', { stdio: 'inherit' });
    console.log('✓ pip is bootstrapped!');

    // Clean up booster script
    if (fs.existsSync('./get-pip.py')) {
      fs.unlinkSync('./get-pip.py');
    }

    console.log('Installing pandas, numpy, lightgbm, scikit-learn, joblib, pybaseball via pip...');
    // We run python3 -m pip with --user so it installs inside the user path without requiring root
    execSync('python3 -m pip install pandas numpy lightgbm scikit-learn joblib pybaseball --user --quiet', { stdio: 'inherit' });
    console.log('🎉 All python dependencies are successfully installed!');

  } catch (error) {
    console.error('❌ Failed bootstrapping python environment:', error.message || error);
    process.exit(1);
  }
}

run();
