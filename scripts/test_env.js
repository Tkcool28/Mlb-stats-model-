import { execSync } from 'child_process';

try {
  console.log('Which python3:', execSync('which python3', { encoding: 'utf8' }).trim());
  console.log('Python version:', execSync('python3 --version', { encoding: 'utf8' }).trim());
  try {
    console.log('Which pip3:', execSync('which pip3', { encoding: 'utf8' }).trim());
  } catch (e) {
    console.log('pip3 not found via which');
  }
  try {
    console.log('Which pip:', execSync('which pip', { encoding: 'utf8' }).trim());
  } catch (e) {
    console.log('pip not found via which');
  }
  try {
    console.log('Conda version:', execSync('conda --version', { encoding: 'utf8' }).trim());
  } catch (e) {
    console.log('conda not found');
  }
} catch (error) {
  console.error('Test env error:', error);
}
