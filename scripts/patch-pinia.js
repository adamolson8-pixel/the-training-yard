import fs from 'fs';
import path from 'path';

const files = [
  'node_modules/@pinia/nuxt/dist/runtime/plugin.vue3.js',
  'node_modules/@pinia/nuxt/dist/runtime/plugin.vue3.mjs'
];

files.forEach(file => {
  const fullPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(
      'nuxtApp.payload.pinia = toRaw(nuxtApp.$pinia).state.value;',
      'if (nuxtApp.$pinia) { nuxtApp.payload.pinia = toRaw(nuxtApp.$pinia).state.value; }'
    );
    fs.writeFileSync(fullPath, content);
    console.log(`Patched ${file}`);
  }
});
