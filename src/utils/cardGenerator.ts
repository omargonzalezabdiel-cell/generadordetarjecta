export type CardBrand = 'visa' | 'mastercard' | 'amex';

export interface CardData {
  id: string;
  number: string;
  numberFormatted: string;
  holder: string;
  expiry: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  brand: CardBrand;
  bin: string;
  network: string;
}

interface BinPrefix {
  brand: CardBrand;
  network: string;
  prefixes: string[];
  length: number;
  cvvLength: number;
}

const BIN_PREFIXES: BinPrefix[] = [
  {
    brand: 'visa',
    network: 'Visa',
    prefixes: ['4532', '4539', '4024', '4485', '4716', '4929', '4403', '4514'],
    length: 16,
    cvvLength: 3,
  },
  {
    brand: 'mastercard',
    network: 'Mastercard',
    prefixes: ['5412', '5289', '5234', '5555', '2221', '2720', '5318', '5128'],
    length: 16,
    cvvLength: 3,
  },
  {
    brand: 'amex',
    network: 'American Express',
    prefixes: ['34', '37'],
    length: 15,
    cvvLength: 4,
  },
];

const FIRST_NAMES = [
  'James', 'Maria', 'John', 'Sophia', 'Robert', 'Isabella', 'Michael', 'Emma',
  'David', 'Olivia', 'Carlos', 'Lucia', 'Juan', 'Camila', 'Diego', 'Valentina',
  'Alejandro', 'Daniela', 'Fernando', 'Gabriela', 'Ricardo', 'Patricia',
  'Andres', 'Carolina', 'Javier', 'Mariana', 'Manuel', 'Elena', 'Pablo', 'Cristina',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Garcia', 'Martinez', 'Lopez', 'Gonzalez', 'Rodriguez',
  'Fernandez', 'Torres', 'Rivera', 'Ramirez', 'Cruz', 'Reyes', 'Morales',
  'Ortiz', 'Gutierrez', 'Chavez', 'Herrera', 'Medina', 'Aguilar', 'Vargas',
  'Castillo', 'Salazar', 'Romero', 'Vasquez', 'Mendoza', 'Rojas', 'Sanchez',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function luhnCheckDigit(partial: string): string {
  const digits = partial.split('').reverse().map(Number);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = digits[i];
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return String((10 - (sum % 10)) % 10);
}

function generateNumber(bin: BinPrefix): string {
  const prefix = randomChoice(bin.prefixes);
  const remainingLength = bin.length - prefix.length - 1; // -1 for check digit
  let middle = '';
  for (let i = 0; i < remainingLength; i++) {
    middle += randomInt(0, 9);
  }
  const partial = prefix + middle;
  const checkDigit = luhnCheckDigit(partial);
  return partial + checkDigit;
}

function formatNumber(number: string, brand: CardBrand): string {
  if (brand === 'amex') {
    return number.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
  }
  return number.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function generateHolder(): string {
  return `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`.toUpperCase();
}

function generateExpiry(): { month: string; year: string; combined: string } {
  const month = String(randomInt(1, 12)).padStart(2, '0');
  const currentYear = new Date().getFullYear();
  const year = String(randomInt(currentYear + 1, currentYear + 8));
  return { month, year, combined: `${month}/${year}` };
}

function generateCVV(length: number): string {
  let cvv = '';
  for (let i = 0; i < length; i++) {
    cvv += randomInt(0, 9);
  }
  return cvv;
}

export function generateCard(brand?: CardBrand): CardData {
  const bin = brand
    ? BIN_PREFIXES.find((b) => b.brand === brand)!
    : randomChoice(BIN_PREFIXES);

  const number = generateNumber(bin);
  const { month, year, combined } = generateExpiry();

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    number,
    numberFormatted: formatNumber(number, bin.brand),
    holder: generateHolder(),
    expiry: combined,
    expiryMonth: month,
    expiryYear: year,
    cvv: generateCVV(bin.cvvLength),
    brand: bin.brand,
    bin: number.slice(0, 6),
    network: bin.network,
  };
}

export function generateMultipleCards(brand: CardBrand, count: number): CardData[] {
  return Array.from({ length: count }, () => generateCard(brand));
}
