// Code generated by protoc-gen-js-fetch.
// DO NOT EDIT!


export class Language {
  code: string;
  name: string;
  isSource: boolean;
}

export class Text {
  name: string;
  languageCode: string;
  text: string;
  tags: string[];
  comment: string;
}

export class LanguageEntries {
  languageCode: string;
  text: Text[];
}

export class Languages {
  languages: Language[];
}
