export class Identifier {
  name: string = "";
  edition: string = "";

  constructor(name: string, edition: string) {
    this.name = name;
    this.edition = edition;
  }
}

export class CountIdentifier extends Identifier {

  count: number;

  constructor(name: string, edition: string, count: number = -1) {
    super(name, edition);
    this.count = count;
  }
}

export class AdditionalIdentifier extends Identifier {
  type: "all" | "character" | "characterWithSummon" | "objective" | "monster" | undefined;
  marker: string | undefined;
  tags: string[] | undefined;;

  constructor(name: string, edition: string, type: "all" | "character" | "characterWithSummon" | "objective" | "monster" | undefined = undefined, marker: string | undefined = undefined, tags: string[] | undefined = undefined) {
    super(name, edition);
    this.type = type;
    this.marker = marker;
    this.tags = tags;
  }
}