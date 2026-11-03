/* Writes public/build-info.json at build time: whether the private study
 * material (the git submodule) was present when this build ran. A boolean
 * only; it lets the owner tell "not cloned" from "not shipped to the functions". */
import fs from 'node:fs';
const present = fs.existsSync('private/allowed-emails.json');
const files = present ? fs.readdirSync('private') : [];
fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/build-info.json', JSON.stringify({ privateInstalledAtBuild: present, entries: files.length }) + '\n');
console.log(`build-info: private material ${present ? 'present' : 'absent'}`);
