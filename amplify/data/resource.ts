import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  Workspace: a.model({
    document: a.json().required(),
  }).authorization(allow => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
});
