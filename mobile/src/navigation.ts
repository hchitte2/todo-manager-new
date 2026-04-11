export type RootStackParamList = {
  Auth: undefined;
  Home: { token: string; email: string };
  ListDetail: { token: string; listId: string; listName: string };
};
