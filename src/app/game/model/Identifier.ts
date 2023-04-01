export class Identifier {
  name: string = "";
  edition: string = "";

  constructor(name: string, edition: string) {
    this.name = name;
    this.edition = edition;
  }
}

export class AdditionalIdentifier extends Identifier {
  type: "all" | "character" | "objective" | "monster" | undefined;
  marker: string | undefined;
  tags: string[] | undefined;;

  constructor(type: "all" | "character" | "objective" | "monster" | undefined, name: string, edition: string, marker: string | undefined = undefined, tags: string[] | undefined = undefined) {
    super(name, edition);
    this.type = type;
    this.marker = marker;
    this.tags = tags;
  }
}