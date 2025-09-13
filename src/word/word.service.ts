import { Injectable } from '@nestjs/common';
import { Dictionary } from '../interfaces/game.interface';

@Injectable()
export class WordService {
  private dictionary: Dictionary = {
    "Perro": {
      "indices": ["per", "err", "rro"]
    },
    "Gato": {
      "indices": ["gat", "ato"]
    },
    "Caballo": {
      "indices": ["cab", "aba", "bal", "all", "llo"]
    },
    "Vaca": {
      "indices": ["vac", "aca"]
    },
    "Cerdo": {
      "indices": ["cer", "erd", "rdo"]
    },
    "Oveja": {
      "indices": ["ove", "vej", "eja"]
    },
    "Cabra": {
      "indices": ["cab", "abr", "bra"]
    },
    "Gallina": {
      "indices": ["gal", "all", "lli", "lin", "ina"]
    },
    "Pato": {
      "indices": ["pat", "ato"]
    },
    "Pavo": {
      "indices": ["pav", "avo"]
    },
    "Conejo": {
      "indices": ["con", "one", "nej", "ejo"]
    },
    "Ciervo": {
      "indices": ["cie", "ier", "erv", "rvo"]
    },
    "Oso": {
      "indices": ["oso"]
    },
    "Lobo": {
      "indices": ["lob", "obo"]
    },
    "Zorro": {
      "indices": ["zor", "orr", "rro"]
    },
    "Tigre": {
      "indices": ["tig", "igr", "gre"]
    },
    "Leon": {
      "indices": ["leo", "eon"]
    },
    "Elefante": {
      "indices": ["ele", "lef", "efa", "fan", "ant", "nte"]
    },
    "Jirafa": {
      "indices": ["jir", "ira", "raf", "afa"]
    },
    "Cebra": {
      "indices": ["ceb", "ebr", "bra"]
    },
    "Pan": {
      "indices": ["pan"]
    },
    "Arroz": {
      "indices": ["arr", "rro", "roz"]
    },
    "Pasta": {
      "indices": ["pas", "ast", "sta"]
    },
    "Pizza": {
      "indices": ["piz", "izz", "zza"]
    },
    "Hamburguesa": {
      "indices": ["ham", "amb", "mbu", "bur", "urg", "rgu", "gue", "ues", "esa"]
    },
    "Sushi": {
      "indices": ["sus", "ush", "shi"]
    },
    "Ensalada": {
      "indices": ["ens", "nsa", "sal", "ala", "lad", "ada"]
    },
    "Sopa": {
      "indices": ["sop", "opa"]
    },
    "Taco": {
      "indices": ["tac", "aco"]
    },
    "Curry": {
      "indices": ["cur", "urr", "rry"]
    },
    "Tortilla": {
      "indices": ["tor", "ort", "rti", "til", "ill", "lla"]
    },
    "Pollo": {
      "indices": ["pol", "oll", "llo"]
    },
    "Carne": {
      "indices": ["car", "arn", "rne"]
    },
    "Pescado": {
      "indices": ["pes", "esc", "sca", "cad", "ado"]
    },
    "Queso": {
      "indices": ["que", "ues", "eso"]
    },
    "Frijoles": {
      "indices": ["fri", "rij", "ijo", "jol", "ole", "les"]
    },
    "Lentejas": {
      "indices": ["len", "ent", "nte", "tej", "eja", "jas"]
    },
    "Sandwich": {
      "indices": ["san", "and", "ndw", "dwi", "wic", "ich"]
    },
    "Empanada": {
      "indices": ["emp", "mpa", "pan", "ana", "nad", "ada"]
    },
    "Ceviche": {
      "indices": ["cev", "evi", "vic", "ich", "che"]
    },
    "Manzana": {
      "indices": ["man", "anz", "nza", "zan", "ana"]
    },
    "Platano": {
      "indices": ["pla", "lat", "ata", "tan", "ano"]
    },
    "Naranja": {
      "indices": ["nar", "ara", "ran", "anj", "nja"]
    },
    "Fresa": {
      "indices": ["fre", "res", "esa"]
    },
    "Uva": {
      "indices": ["uva"]
    },
    "Mango": {
      "indices": ["man", "ang", "ngo"]
    },
    "Pina": {
      "indices": ["pin", "ina"]
    },
    "Sandia": {
      "indices": ["san", "and", "ndi", "dia"]
    },
    "Melon": {
      "indices": ["mel", "elo", "lon"]
    },
    "Pera": {
      "indices": ["per", "era"]
    },
    "Durazno": {
      "indices": ["dur", "ura", "raz", "azn", "zno"]
    },
    "Cereza": {
      "indices": ["cer", "ere", "rez", "eza"]
    },
    "Kiwi": {
      "indices": ["kiw", "iwi"]
    },
    "Papaya": {
      "indices": ["pap", "apa", "pay", "aya"]
    },
    "Guayaba": {
      "indices": ["gua", "uay", "aya", "yab", "aba"]
    },
    "Granada": {
      "indices": ["gra", "ran", "ana", "nad", "ada"]
    },
    "Higo": {
      "indices": ["hig", "igo"]
    },
    "Lima": {
      "indices": ["lim", "ima"]
    },
    "Mandarina": {
      "indices": ["man", "and", "nda", "dar", "ari", "rin", "ina"]
    },
    "Toronja": {
      "indices": ["tor", "oro", "ron", "onj", "nja"]
    }
  };

  private allIndices: string[] = [];

  constructor() {
    this.initializeIndices();
  }

  private initializeIndices() {
    const indicesSet = new Set<string>();
    
    Object.values(this.dictionary).forEach(wordData => {
      wordData.indices.forEach(index => {
        indicesSet.add(index);
      });
    });

    this.allIndices = Array.from(indicesSet);
  }

  getRandomBombIndices(): string {
    const randomIndex = Math.floor(Math.random() * this.allIndices.length);
    return this.allIndices[randomIndex];
  }

  validateWord(word: string, bombIndices: string): boolean {
    const wordLower = word.toLowerCase();
    const bombLower = bombIndices.toLowerCase();

    // Verificar si la palabra existe en el diccionario
    const dictionaryKey = Object.keys(this.dictionary).find(
      key => key.toLowerCase() === wordLower
    );

    if (!dictionaryKey) {
      return false;
    }

    // Verificar si la palabra contiene los indices de la bomba
    const wordIndices = this.dictionary[dictionaryKey].indices;
    return wordIndices.some(index => index.toLowerCase() === bombLower);
  }

  wordContainsBombIndices(word: string, bombIndices: string): boolean {
    const wordLower = word.toLowerCase();
    const bombLower = bombIndices.toLowerCase();
    return wordLower.includes(bombLower);
  }

  checkWordProgress(word: string, bombIndices: string): boolean {
    return this.wordContainsBombIndices(word, bombIndices);
  }

  getAllWords(): string[] {
    return Object.keys(this.dictionary);
  }

  getWordIndices(word: string): string[] {
    const dictionaryKey = Object.keys(this.dictionary).find(
      key => key.toLowerCase() === word.toLowerCase()
    );
    
    return dictionaryKey ? this.dictionary[dictionaryKey].indices : [];
  }
}