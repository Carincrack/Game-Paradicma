import { Injectable } from '@nestjs/common';
import { Dictionary } from '../interfaces/game.interface';

@Injectable()
export class WordService {
  private dictionary: Dictionary = {

  "Perro": {
    "indices": ["pe", "er", "rr", "ro", "per", "err", "rro"]
  },
  "Gato": {
    "indices": ["ga", "at", "to", "gat", "ato"]
  },
  "Caballo": {
    "indices": ["ca", "ab", "ba", "al", "ll", "lo", "cab", "aba", "bal", "all", "llo"]
  },
  "Vaca": {
    "indices": ["va", "ac", "ca", "vac", "aca"]
  },
  "Leon": {
    "indices": ["le", "eo", "on", "leo", "eon"]
  },
  "Tigre": {
    "indices": ["ti", "ig", "gr", "re", "tig", "igr", "gre"]
  },
  "Elefante": {
    "indices": ["el", "le", "ef", "fa", "an", "nt", "te", "ele", "lef", "efa", "fan", "ant", "nte"]
  },
  "Jirafa": {
    "indices": ["ji", "ir", "ra", "af", "fa", "jir", "ira", "raf", "afa"]
  },
  "Mono": {
    "indices": ["mo", "on", "no", "mon", "ono"]
  },
  "Oso": {
    "indices": ["os", "so", "oso"]
  },
  "Lobo": {
    "indices": ["lo", "ob", "bo", "lob", "obo"]
  },
  "Zorro": {
    "indices": ["zo", "or", "rr", "ro", "zor", "orr", "rro"]
  },
  "Conejo": {
    "indices": ["co", "on", "ne", "ej", "jo", "con", "one", "nej", "ejo"]
  },
  "Ciervo": {
    "indices": ["ci", "ie", "er", "rv", "vo", "cie", "ier", "erv", "rvo"]
  },
  "Aguila": {
    "indices": ["ag", "gu", "ui", "il", "la", "agu", "gui", "uil", "ila"]
  },
  "Paloma": {
    "indices": ["pa", "al", "lo", "om", "ma", "pal", "alo", "lom", "oma"]
  },
  "Loro": {
    "indices": ["lo", "or", "ro", "lor", "oro"]
  },
  "Pez": {
    "indices": ["pe", "ez", "pez"]
  },
  "Tiburon": {
    "indices": ["ti", "ib", "bu", "ur", "ro", "on", "tib", "ibu", "bur", "uro", "ron"]
  },
  "Delfin": {
    "indices": ["de", "el", "lf", "fi", "in", "del", "elf", "lfi", "fin"]
  },
  "Ballena": {
    "indices": ["ba", "al", "ll", "le", "en", "na", "bal", "all", "lle", "len", "ena"]
  },
  "Pulpo": {
    "indices": ["pu", "ul", "lp", "po", "pul", "ulp", "lpo"]
  },
  "Medusa": {
    "indices": ["me", "ed", "du", "us", "sa", "med", "edu", "dus", "usa"]
  },
  "Serpiente": {
    "indices": ["se", "er", "rp", "pi", "ie", "en", "nt", "te", "ser", "erp", "rpi", "pie", "ien", "ent", "nte"]
  },
  "Lagarto": {
    "indices": ["la", "ag", "ga", "ar", "rt", "to", "lag", "aga", "gar", "art", "rto"]
  },
  "Cocodrilo": {
    "indices": ["co", "oc", "co", "od", "dr", "ri", "il", "lo", "coc", "oco", "cod", "odr", "dri", "ril", "ilo"]
  },
  "Tortuga": {
    "indices": ["to", "or", "rt", "tu", "ug", "ga", "tor", "ort", "rtu", "tug", "uga"]
  },
  "Rana": {
    "indices": ["ra", "an", "na", "ran", "ana"]
  },
  "Sapo": {
    "indices": ["sa", "ap", "po", "sap", "apo"]
  },
  "Abeja": {
    "indices": ["ab", "be", "ej", "ja", "abe", "bej", "eja"]
  },
  "Mariposa": {
    "indices": ["ma", "ar", "ri", "ip", "po", "os", "sa", "mar", "ari", "rip", "ipo", "pos", "osa"]
  },
  "Hormiga": {
    "indices": ["ho", "or", "rm", "mi", "ig", "ga", "hor", "orm", "rmi", "mig", "iga"]
  },
  "Araña": {
    "indices": ["ar", "ra", "an", "ña", "ara", "ran", "aña"]
  },
  "Escorpion": {
    "indices": ["es", "sc", "co", "or", "rp", "pi", "io", "on", "esc", "sco", "cor", "orp", "rpi", "pio", "ion"]
  },
  "Rojo": {
    "indices": ["ro", "oj", "jo", "roj", "ojo"]
  },
  "Azul": {
    "indices": ["az", "zu", "ul", "azu", "zul"]
  },
  "Verde": {
    "indices": ["ve", "er", "rd", "de", "ver", "erd", "rde"]
  },
  "Amarillo": {
    "indices": ["am", "ma", "ar", "ri", "il", "ll", "lo", "ama", "mar", "ari", "ril", "ill", "llo"]
  },
  "Negro": {
    "indices": ["ne", "eg", "gr", "ro", "neg", "egr", "gro"]
  },
  "Blanco": {
    "indices": ["bl", "la", "an", "nc", "co", "bla", "lan", "anc", "nco"]
  },
  "Rosa": {
    "indices": ["ro", "os", "sa", "ros", "osa"]
  },
  "Morado": {
    "indices": ["mo", "or", "ra", "ad", "do", "mor", "ora", "rad", "ado"]
  },
  "Naranja": {
    "indices": ["na", "ar", "ra", "an", "nj", "ja", "nar", "ara", "ran", "anj", "nja"]
  },
  "Gris": {
    "indices": ["gr", "ri", "is", "gri", "ris"]
  },
  "Violeta": {
    "indices": ["vi", "io", "ol", "le", "et", "ta", "vio", "iol", "ole", "let", "eta"]
  },
  "Dorado": {
    "indices": ["do", "or", "ra", "ad", "do", "dor", "ora", "rad", "ado"]
  },
  "Plateado": {
    "indices": ["pl", "la", "at", "te", "ea", "ad", "do", "pla", "lat", "ate", "tea", "ead", "ado"]
  },
  "Manzana": {
    "indices": ["ma", "an", "nz", "za", "an", "na", "man", "anz", "nza", "zan", "ana"]
  },
  "Platano": {
    "indices": ["pl", "la", "at", "ta", "an", "no", "pla", "lat", "ata", "tan", "ano"]
  },
  "Fresa": {
    "indices": ["fr", "re", "es", "sa", "fre", "res", "esa"]
  },
  "Uva": {
    "indices": ["uv", "va", "uva"]
  },
  "Mango": {
    "indices": ["ma", "an", "ng", "go", "man", "ang", "ngo"]
  },
  "Pina": {
    "indices": ["pi", "in", "na", "pin", "ina"]
  },
  "Sandia": {
    "indices": ["sa", "an", "nd", "di", "ia", "san", "and", "ndi", "dia"]
  },
  "Melon": {
    "indices": ["me", "el", "lo", "on", "mel", "elo", "lon"]
  },
  "Pera": {
    "indices": ["pe", "er", "ra", "per", "era"]
  },
  "Durazno": {
    "indices": ["du", "ur", "ra", "az", "zn", "no", "dur", "ura", "raz", "azn", "zno"]
  },
  "Cereza": {
    "indices": ["ce", "er", "re", "ez", "za", "cer", "ere", "rez", "eza"]
  },
  "Kiwi": {
    "indices": ["ki", "iw", "wi", "kiw", "iwi"]
  },
  "Papaya": {
    "indices": ["pa", "ap", "pa", "ay", "ya", "pap", "apa", "pay", "aya"]
  },
  "Guayaba": {
    "indices": ["gu", "ua", "ay", "ya", "ab", "ba", "gua", "uay", "aya", "yab", "aba"]
  },
  "Coco": {
    "indices": ["co", "oc", "co", "coc", "oco"]
  },
  "Pan": {
    "indices": ["pa", "an", "pan"]
  },
  "Arroz": {
    "indices": ["ar", "rr", "ro", "oz", "arr", "rro", "roz"]
  },
  "Pasta": {
    "indices": ["pa", "as", "st", "ta", "pas", "ast", "sta"]
  },
  "Pizza": {
    "indices": ["pi", "iz", "zz", "za", "piz", "izz", "zza"]
  },
  "Hamburguesa": {
    "indices": ["ha", "am", "mb", "bu", "ur", "rg", "gu", "ue", "es", "sa", "ham", "amb", "mbu", "bur", "urg", "rgu", "gue", "ues", "esa"]
  },
  "Taco": {
    "indices": ["ta", "ac", "co", "tac", "aco"]
  },
  "Sopa": {
    "indices": ["so", "op", "pa", "sop", "opa"]
  },
  "Ensalada": {
    "indices": ["en", "ns", "sa", "al", "la", "ad", "da", "ens", "nsa", "sal", "ala", "lad", "ada"]
  },
  "Pollo": {
    "indices": ["po", "ol", "ll", "lo", "pol", "oll", "llo"]
  },
  "Carne": {
    "indices": ["ca", "ar", "rn", "ne", "car", "arn", "rne"]
  },
  "Pescado": {
    "indices": ["pe", "es", "sc", "ca", "ad", "do", "pes", "esc", "sca", "cad", "ado"]
  },
  "Queso": {
    "indices": ["qu", "ue", "es", "so", "que", "ues", "eso"]
  },
  "Huevo": {
    "indices": ["hu", "ue", "ev", "vo", "hue", "uev", "evo"]
  },
  "Leche": {
    "indices": ["le", "ec", "ch", "he", "lec", "ech", "che"]
  },
  "Casa": {
    "indices": ["ca", "as", "sa", "cas", "asa"]
  },
  "Carro": {
    "indices": ["ca", "ar", "rr", "ro", "car", "arr", "rro"]
  },
  "Tren": {
    "indices": ["tr", "re", "en", "tre", "ren"]
  },
  "Avion": {
    "indices": ["av", "vi", "io", "on", "avi", "vio", "ion"]
  },
  "Barco": {
    "indices": ["ba", "ar", "rc", "co", "bar", "arc", "rco"]
  },
  "Bicicleta": {
    "indices": ["bi", "ic", "ci", "ic", "cl", "le", "et", "ta", "bic", "ici", "cic", "icl", "cle", "let", "eta"]
  },
  "Doctor": {
    "indices": ["do", "oc", "ct", "to", "or", "doc", "oct", "cto", "tor"]
  },
  "Maestro": {
    "indices": ["ma", "ae", "es", "st", "tr", "ro", "mae", "aes", "est", "str", "tro"]
  },
  "Ingeniero": {
    "indices": ["in", "ng", "ge", "en", "ni", "ie", "er", "ro", "ing", "nge", "gen", "eni", "nie", "ier", "ero"]
  },
  "Policia": {
    "indices": ["po", "ol", "li", "ic", "ci", "ia", "pol", "oli", "lic", "ici", "cia"]
  },
  "Bombero": {
    "indices": ["bo", "om", "mb", "be", "er", "ro", "bom", "omb", "mbe", "ber", "ero"]
  },
  "Piloto": {
    "indices": ["pi", "il", "lo", "ot", "to", "pil", "ilo", "lot", "oto"]
  },
  "Cocinero": {
    "indices": ["co", "oc", "ci", "in", "ne", "er", "ro", "coc", "oci", "cin", "ine", "ner", "ero"]
  },
  "Futbol": {
    "indices": ["fu", "ut", "tb", "bo", "ol", "fut", "utb", "tbo", "bol"]
  },
  "Tenis": {
    "indices": ["te", "en", "ni", "is", "ten", "eni", "nis"]
  },
  "Natacion": {
    "indices": ["na", "at", "ta", "ac", "ci", "io", "on", "nat", "ata", "tac", "aci", "cio", "ion"]
  },
  "Basquetbol": {
    "indices": ["ba", "as", "sq", "qu", "ue", "et", "tb", "bo", "ol", "bas", "asq", "squ", "que", "etb", "tbo", "bol"]
  },
  "Voleibol": {
    "indices": ["vo", "ol", "le", "ei", "ib", "bo", "ol", "vol", "ole", "lei", "eib", "ibo", "bol"]
  },
  "Guitarra": {
    "indices": ["gu", "ui", "it", "ta", "ar", "rr", "ra", "gui", "uit", "ita", "tar", "arr", "rra"]
  },
  "Piano": {
    "indices": ["pi", "ia", "an", "no", "pia", "ian", "ano"]
  },
  "Violin": {
    "indices": ["vi", "io", "ol", "li", "in", "vio", "iol", "oli", "lin"]
  },
  "Bateria": {
    "indices": ["ba", "at", "te", "er", "ri", "ia", "bat", "ate", "ter", "eri", "ria"]
  },
  "Flauta": {
    "indices": ["fl", "la", "au", "ut", "ta", "fla", "lau", "aut", "uta"]
  },
  "Martillo": {
    "indices": ["ma", "ar", "rt", "ti", "il", "ll", "lo", "mar", "art", "rti", "til", "ill", "llo"]
  },
  "Cuchillo": {
    "indices": ["cu", "uc", "ch", "hi", "il", "ll", "lo", "cuc", "uch", "chi", "hil", "ill", "llo"]
  },
  "Sierra": {
    "indices": ["si", "ie", "er", "rr", "ra", "sie", "ier", "err", "rra"]
  },
  "Mexico": {
    "indices": ["me", "ex", "xi", "ic", "co", "mex", "exi", "xic", "ico"]
  },
  "España": {
    "indices": ["es", "sp", "pa", "an", "ña", "esp", "spa", "pan", "aña"]
  },
  "Argentina": {
    "indices": ["ar", "rg", "ge", "en", "nt", "ti", "in", "na", "arg", "rge", "gen", "ent", "nti", "tin", "ina"]
  },
  "Brasil": {
    "indices": ["br", "ra", "as", "si", "il", "bra", "ras", "asi", "sil"]
  },
  "Colombia": {
    "indices": ["co", "ol", "lo", "om", "mb", "bi", "ia", "col", "olo", "lom", "omb", "mbi", "bia"]
  },
  "Francia": {
    "indices": ["fr", "ra", "an", "nc", "ci", "ia", "fra", "ran", "anc", "nci", "cia"]
  },
  "Italia": {
    "indices": ["it", "ta", "al", "li", "ia", "ita", "tal", "ali", "lia"]
  },
  "Lunes": {
    "indices": ["lu", "un", "ne", "es", "lun", "une", "nes"]
  },
  "Martes": {
    "indices": ["ma", "ar", "rt", "te", "es", "mar", "art", "rte", "tes"]
  },
  "Miercoles": {
    "indices": ["mi", "ie", "er", "rc", "co", "ol", "le", "es", "mie", "ier", "erc", "rco", "col", "ole", "les"]
  },
  "Jueves": {
    "indices": ["ju", "ue", "ev", "ve", "es", "jue", "uev", "eve", "ves"]
  },
  "Viernes": {
    "indices": ["vi", "ie", "er", "rn", "ne", "es", "vie", "ier", "ern", "rne", "nes"]
  },
  "Sabado": {
    "indices": ["sa", "ab", "ba", "ad", "do", "sab", "aba", "bad", "ado"]
  },
  "Domingo": {
    "indices": ["do", "om", "mi", "in", "ng", "go", "dom", "omi", "min", "ing", "ngo"]
  },
  "Enero": {
    "indices": ["en", "ne", "er", "ro", "ene", "ner", "ero"]
  },
  "Febrero": {
    "indices": ["fe", "eb", "br", "re", "er", "ro", "feb", "ebr", "bre", "rer", "ero"]
  },
  "Marzo": {
    "indices": ["ma", "ar", "rz", "zo", "mar", "arz", "rzo"]
  },
  "Abril": {
    "indices": ["ab", "br", "ri", "il", "abr", "bri", "ril"]
  },
  "Mayo": {
    "indices": ["ma", "ay", "yo", "may", "ayo"]
  },
  "Junio": {
    "indices": ["ju", "un", "ni", "io", "jun", "uni", "nio"]
  },
  "Julio": {
    "indices": ["ju", "ul", "li", "io", "jul", "uli", "lio"]
  },
  "Agosto": {
    "indices": ["ag", "go", "os", "st", "to", "ago", "gos", "ost", "sto"]
  },
  "Septiembre": {
    "indices": ["se", "ep", "pt", "ti", "ie", "em", "mb", "br", "re", "sep", "ept", "pti", "tie", "iem", "emb", "mbr", "bre"]
  },
  "Octubre": {
    "indices": ["oc", "ct", "tu", "ub", "br", "re", "oct", "ctu", "tub", "ubr", "bre"]
  },
  "Noviembre": {
    "indices": ["no", "ov", "vi", "ie", "em", "mb", "br", "re", "nov", "ovi", "vie", "iem", "emb", "mbr", "bre"]
  },
  "Diciembre": {
    "indices": ["di", "ic", "ci", "ie", "em", "mb", "br", "re", "dic", "ici", "cie", "iem", "emb", "mbr", "bre"]
  },
  "Taxi": {
    "indices": ["ta", "ax", "xi", "tax", "axi"]
  },
  "Metro": {
    "indices": ["me", "et", "tr", "ro", "met", "etr", "tro"]
  },
  "Autobus": {
    "indices": ["au", "ut", "to", "ob", "bu", "us", "aut", "uto", "tob", "obu", "bus"]
  },
  "Helicoptero": {
    "indices": ["he", "el", "li", "ic", "co", "op", "pt", "te", "er", "ro", "hel", "eli", "lic", "ico", "cop", "opt", "pte", "ter", "ero"]
  },
  "Camion": {
    "indices": ["ca", "am", "mi", "io", "on", "cam", "ami", "mio", "ion"]
  },
  "Ambulancia": {
    "indices": ["am", "mb", "bu", "ul", "la", "an", "nc", "ci", "ia", "amb", "mbu", "bul", "ula", "lan", "anc", "nci", "cia"]
  },
  "Trompeta": {
    "indices": ["tr", "ro", "om", "mp", "pe", "et", "ta", "tro", "rom", "omp", "mpe", "pet", "eta"]
  },
  "Saxofon": {
    "indices": ["sa", "ax", "xo", "of", "fo", "on", "sax", "axo", "xof", "ofo", "fon"]
  },
  "Clarinete": {
    "indices": ["cl", "la", "ar", "ri", "in", "ne", "et", "te", "cla", "lar", "ari", "rin", "ine", "net", "ete"]
  },
  "Arpa": {
    "indices": ["ar", "rp", "pa", "arp", "rpa"]
  },
  "Bajo": {
    "indices": ["ba", "aj", "jo", "baj", "ajo"]
  },
  "Acordeon": {
    "indices": ["ac", "co", "or", "rd", "de", "eo", "on", "aco", "cor", "ord", "rde", "deo", "eon"]
  },
  "Maracas": {
    "indices": ["ma", "ar", "ra", "ac", "ca", "as", "mar", "ara", "rac", "aca", "cas"]
  },
  "Abogado": {
    "indices": ["ab", "bo", "og", "ga", "ad", "do", "abo", "bog", "oga", "gad", "ado"]
  },
  "Enfermero": {
    "indices": ["en", "nf", "fe", "er", "rm", "me", "er", "ro", "enf", "nfe", "fer", "erm", "rme", "mer", "ero"]
  },
  "Arquitecto": {
    "indices": ["ar", "rq", "qu", "ui", "it", "te", "ec", "ct", "to", "arq", "rqu", "qui", "uit", "ite", "tec", "ect", "cto"]
  },
  "Dentista": {
    "indices": ["de", "en", "nt", "ti", "is", "st", "ta", "den", "ent", "nti", "tis", "ist", "sta"]
  },
  "Veterinario": {
    "indices": ["ve", "et", "te", "er", "ri", "in", "na", "ar", "ri", "io", "vet", "ete", "ter", "eri", "rin", "ina", "nar", "ari", "rio"]
  },
  "Destornillador": {
    "indices": ["de", "es", "st", "to", "or", "rn", "ni", "il", "ll", "la", "ad", "do", "or", "des", "est", "sto", "tor", "orn", "rni", "nil", "ill", "lla", "lad", "ado", "dor"]
  },
  "Taladro": {
    "indices": ["ta", "al", "la", "ad", "dr", "ro", "tal", "ala", "lad", "adr", "dro"]
  },
  "Llave": {
    "indices": ["ll", "la", "av", "ve", "lla", "lav", "ave"]
  },
  "Alicate": {
    "indices": ["al", "li", "ic", "ca", "at", "te", "ali", "lic", "ica", "cat", "ate"]
  },
  "Hacha": {
    "indices": ["ha", "ac", "ch", "ha", "hac", "ach", "cha"]
  },
  "Pala": {
    "indices": ["pa", "al", "la", "pal", "ala"]
  },
  "Rastrillo": {
    "indices": ["ra", "as", "st", "tr", "ri", "il", "ll", "lo", "ras", "ast", "str", "tri", "ril", "ill", "llo"]
  },
  "Nivel": {
    "indices": ["ni", "iv", "ve", "el", "niv", "ive", "vel"]
  },
  "Atletismo": {
    "indices": ["at", "tl", "le", "et", "ti", "is", "sm", "mo", "atl", "tle", "let", "eti", "tis", "ism", "smo"]
  },
  "Ciclismo": {
    "indices": ["ci", "ic", "cl", "li", "is", "sm", "mo", "cic", "icl", "cli", "lis", "ism", "smo"]
  },
  "Boxeo": {
    "indices": ["bo", "ox", "xe", "eo", "box", "oxe", "xeo"]
  },
  "Golf": {
    "indices": ["go", "ol", "lf", "gol", "olf"]
  },
  "Beisbol": {
    "indices": ["be", "ei", "is", "sb", "bo", "ol", "bei", "eis", "isb", "sbo", "bol"]
  },
  "Rugby": {
    "indices": ["ru", "ug", "gb", "by", "rug", "ugb", "gby"]
  },
  "Hockey": {
    "indices": ["ho", "oc", "ck", "ke", "ey", "hoc", "ock", "cke", "key"]
  },
  "Karate": {
    "indices": ["ka", "ar", "ra", "at", "te", "kar", "ara", "rat", "ate"]
  },
  "Yoga": {
    "indices": ["yo", "og", "ga", "yog", "oga"]
  },
  "Surf": {
    "indices": ["su", "ur", "rf", "sur", "urf"]
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