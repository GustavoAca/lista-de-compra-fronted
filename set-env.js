const fs = require('fs');

const envConfig = `
export const environment = {
  production: true,
  securityApiUrl:  '${process.env.API_SECURITY_URL}',
  listApiUrl:  '${process.env.API_LISTA_URL}'
};
`;

fs.writeFileSync(
  './src/environments/environment.production.ts',
  envConfig
);
