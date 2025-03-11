/**
 * Tests for the Expression Language Parser
 */

import ExpressionLanguageParser from '../components/expression-language-parser';

describe('ExpressionLanguageParser', () => {
  let parser;

  beforeEach(() => {
    parser = new ExpressionLanguageParser();
    // Set up the myCollection variable that's used in examples
    const initResult = parser.evaluate('myCollection = [1, 2, 3]');
    console.log('Init result:', initResult);
  });

  describe('Literals', () => {
    test('should evaluate number literals', () => {
      const result = parser.evaluate('42');
      console.log('Number literal result:', result);
      expect(result.success).toBe(true);
      expect(result.result).toBe('42');
    });

    test('should evaluate string literals', () => {
      const result = parser.evaluate('"hello"');
      console.log('String literal result:', result);
      expect(result.success).toBe(true);
      expect(result.result).toBe('"hello"');
    });

    test('should evaluate boolean literals', () => {
      const trueResult = parser.evaluate('true');
      console.log('Boolean true result:', trueResult);
      expect(trueResult.success).toBe(true);
      expect(trueResult.result).toBe('True');

      const falseResult = parser.evaluate('false');
      console.log('Boolean false result:', falseResult);
      expect(falseResult.success).toBe(true);
      expect(falseResult.result).toBe('False');
    });

    test('should evaluate array literals', () => {
      const result = parser.evaluate('[1, 2, 3]');
      expect(result.success).toBe(true);
      expect(result.result).toBe('[1, 2, 3]');
    });
  });

  describe('Variables', () => {
    test('should assign and access variables', () => {
      const assignResult = parser.evaluate('x = 5');
      expect(assignResult.success).toBe(true);
      expect(assignResult.result).toBe('5');

      const accessResult = parser.evaluate('x');
      expect(accessResult.success).toBe(true);
      expect(accessResult.result).toBe('5');
    });

    test('should reassign variables', () => {
      parser.evaluate('x = 5');

      const reassignResult = parser.evaluate('x = 10');
      expect(reassignResult.success).toBe(true);
      expect(reassignResult.result).toBe('10');

      const accessResult = parser.evaluate('x');
      expect(accessResult.success).toBe(true);
      expect(accessResult.result).toBe('10');
    });

    test('should handle different variable types', () => {
      const strResult = parser.evaluate('str = "hello"');
      expect(strResult.success).toBe(true);
      expect(strResult.result).toBe('"hello"');

      const boolResult = parser.evaluate('flag = true');
      expect(boolResult.success).toBe(true);
      expect(boolResult.result).toBe('True');

      const arrResult = parser.evaluate('arr = [1, 2, 3]');
      expect(arrResult.success).toBe(true);
      expect(arrResult.result).toBe('[1, 2, 3]');
    });
  });

  describe('Arithmetic', () => {
    test('should perform basic arithmetic', () => {
      const addResult = parser.evaluate('5 + 3');
      expect(addResult.success).toBe(true);
      expect(addResult.result).toBe('8');

      const subResult = parser.evaluate('5 - 3');
      expect(subResult.success).toBe(true);
      expect(subResult.result).toBe('2');

      const mulResult = parser.evaluate('5 * 3');
      expect(mulResult.success).toBe(true);
      expect(mulResult.result).toBe('15');

      const divResult = parser.evaluate('6 / 3');
      expect(divResult.success).toBe(true);
      expect(divResult.result).toBe('2');
    });

    test('should respect operator precedence', () => {
      const noParenResult = parser.evaluate('2 + 3 * 4');
      expect(noParenResult.success).toBe(true);
      expect(noParenResult.result).toBe('14');

      const parenResult = parser.evaluate('(2 + 3) * 4');
      expect(parenResult.success).toBe(true);
      expect(parenResult.result).toBe('20');
    });

    test('should handle variables in arithmetic', () => {
      parser.evaluate('x = 10');

      const result = parser.evaluate('x + 5');
      expect(result.success).toBe(true);
      expect(result.result).toBe('15');
    });

    test('should handle negative numbers', () => {
      const result = parser.evaluate('-5');
      expect(result.success).toBe(true);
      expect(result.result).toBe('-5');
    });

    test('should handle decimal numbers', () => {
      const result = parser.evaluate('3.14');
      expect(result.success).toBe(true);
      expect(result.result).toBe('3.14');
    });
  });

  describe('Comparisons', () => {
    test('should evaluate equality', () => {
      const trueResult = parser.evaluate('5 == 5');
      expect(trueResult.success).toBe(true);
      expect(trueResult.result).toBe('True');

      const falseResult = parser.evaluate('5 == 6');
      expect(falseResult.success).toBe(true);
      expect(falseResult.result).toBe('False');
    });

    test('should evaluate inequality', () => {
      const trueResult = parser.evaluate('5 != 6');
      expect(trueResult.success).toBe(true);
      expect(trueResult.result).toBe('True');

      const falseResult = parser.evaluate('5 != 5');
      expect(falseResult.success).toBe(true);
      expect(falseResult.result).toBe('False');
    });

    test('should evaluate greater than', () => {
      const trueResult = parser.evaluate('5 > 3');
      expect(trueResult.success).toBe(true);
      expect(trueResult.result).toBe('True');

      const falseResult = parser.evaluate('3 > 5');
      expect(falseResult.success).toBe(true);
      expect(falseResult.result).toBe('False');
    });

    test('should evaluate less than', () => {
      const trueResult = parser.evaluate('3 < 5');
      expect(trueResult.success).toBe(true);
      expect(trueResult.result).toBe('True');

      const falseResult = parser.evaluate('5 < 3');
      expect(falseResult.success).toBe(true);
      expect(falseResult.result).toBe('False');
    });

    test('should evaluate greater than or equal', () => {
      const trueResult = parser.evaluate('5 >= 5');
      expect(trueResult.success).toBe(true);
      expect(trueResult.result).toBe('True');

      const falseResult = parser.evaluate('3 >= 5');
      expect(falseResult.success).toBe(true);
      expect(falseResult.result).toBe('False');
    });

    test('should evaluate less than or equal', () => {
      const trueResult = parser.evaluate('5 <= 5');
      expect(trueResult.success).toBe(true);
      expect(trueResult.result).toBe('True');

      const falseResult = parser.evaluate('5 <= 3');
      expect(falseResult.success).toBe(true);
      expect(falseResult.result).toBe('False');
    });

    test('should compare strings', () => {
      const result = parser.evaluate('"abc" == "abc"');
      expect(result.success).toBe(true);
      expect(result.result).toBe('True');
    });
  });

  describe('Logical Operations', () => {
    test('should evaluate logical AND', () => {
      const trueResult = parser.evaluate('true && true');
      expect(trueResult.success).toBe(true);
      expect(trueResult.result).toBe('True');

      const falseResult = parser.evaluate('true && false');
      expect(falseResult.success).toBe(true);
      expect(falseResult.result).toBe('False');
    });

    test('should evaluate logical OR', () => {
      const trueResult = parser.evaluate('true || false');
      expect(trueResult.success).toBe(true);
      expect(trueResult.result).toBe('True');

      const falseResult = parser.evaluate('false || false');
      expect(falseResult.success).toBe(true);
      expect(falseResult.result).toBe('False');
    });

    test('should evaluate logical NOT', () => {
      const notFalseResult = parser.evaluate('!false');
      expect(notFalseResult.success).toBe(true);
      expect(notFalseResult.result).toBe('True');

      const notTrueResult = parser.evaluate('!true');
      expect(notTrueResult.success).toBe(true);
      expect(notTrueResult.result).toBe('False');

      const wordNotFalseResult = parser.evaluate('not false');
      expect(wordNotFalseResult.success).toBe(true);
      expect(wordNotFalseResult.result).toBe('True');

      const wordNotTrueResult = parser.evaluate('not true');
      expect(wordNotTrueResult.success).toBe(true);
      expect(wordNotTrueResult.result).toBe('False');
    });

    test('should evaluate complex logical expressions', () => {
      const result = parser.evaluate('(5 > 3) && (2 < 4)');
      expect(result.success).toBe(true);
      expect(result.result).toBe('True');
    });
  });

  describe('Array Access', () => {
    test('should access array elements', () => {
      const result = parser.evaluate('myCollection[0]');
      expect(result.success).toBe(true);
      expect(result.result).toBe('1');
    });

    test('should access elements of array variables', () => {
      parser.evaluate('arr = [1, 2, 3]');

      const result = parser.evaluate('arr[1]');
      expect(result.success).toBe(true);
      expect(result.result).toBe('2');
    });

    test('should handle array access in arithmetic', () => {
      const result = parser.evaluate('myCollection[0] + 2');
      expect(result.success).toBe(true);
      expect(result.result).toBe('3');
    });

    test('should handle array access in comparisons', () => {
      const result = parser.evaluate('myCollection[1] > myCollection[0]');
      expect(result.success).toBe(true);
      expect(result.result).toBe('True');
    });
  });

  describe('Functions', () => {
    test('should evaluate len function', () => {
      const strResult = parser.evaluate('len("hello")');
      expect(strResult.success).toBe(true);
      expect(strResult.result).toBe('5');

      const arrResult = parser.evaluate('len(myCollection)');
      expect(arrResult.success).toBe(true);
      expect(arrResult.result).toBe('3');
    });

    test('should evaluate contains function', () => {
      const strResult = parser.evaluate('contains("hello world", "world")');
      expect(strResult.success).toBe(true);
      expect(strResult.result).toBe('True');

      const arrResult = parser.evaluate('contains(myCollection, 2)');
      expect(arrResult.success).toBe(true);
      expect(arrResult.result).toBe('True');
    });

    test('should evaluate string functions', () => {
      const startsWithResult = parser.evaluate('startsWith("hello", "he")');
      expect(startsWithResult.success).toBe(true);
      expect(startsWithResult.result).toBe('True');

      const endsWithResult = parser.evaluate('endsWith("hello", "lo")');
      expect(endsWithResult.success).toBe(true);
      expect(endsWithResult.result).toBe('True');

      const substringResult = parser.evaluate('substring("hello", 1, 3)');
      expect(substringResult.success).toBe(true);
      expect(substringResult.result).toBe('"el"');

      const isEmptyFalseResult = parser.evaluate('isEmpty("hello")');
      expect(isEmptyFalseResult.success).toBe(true);
      expect(isEmptyFalseResult.result).toBe('False');

      const isEmptyTrueResult = parser.evaluate('isEmpty("")');
      expect(isEmptyTrueResult.success).toBe(true);
      expect(isEmptyTrueResult.result).toBe('True');
    });

    test('should evaluate matches function', () => {
      const result = parser.evaluate('matches("Hello", "^H.*o$")');
      expect(result.success).toBe(true);
      expect(result.result).toBe('True');
    });

    test('should evaluate collection functions', () => {
      const result = parser.evaluate('filter(myCollection, {@it > 1})');
      expect(result.success).toBe(true);
      expect(result.result).toBe('[2, 3]');
    });
  });

  describe('Multi-Statement Expressions', () => {
    test('should evaluate multiple statements', () => {
      const result = parser.evaluate('x = 5; y = 10; x + y');
      expect(result.success).toBe(true);
      expect(result.result).toBe('15');
    });

    test('should handle arrays in multi-statements', () => {
      const result = parser.evaluate('a = [1, 2]; a[0] + a[1]');
      expect(result.success).toBe(true);
      expect(result.result).toBe('3');
    });

    test('should handle functions in multi-statements', () => {
      const result = parser.evaluate('str = "hello"; len(str)');
      expect(result.success).toBe(true);
      expect(result.result).toBe('5');
    });
  });

  describe('Parenthesized Expressions', () => {
    test('should evaluate simple parenthesized expressions', () => {
      const result = parser.evaluate('(2 + 3)');
      console.log('Simple parenthesized expression result:', result);
      expect(result.success).toBe(true);
      expect(result.result).toBe('5');
    });

    test('should respect operator precedence with parentheses', () => {
      const result = parser.evaluate('(2 + 3) * 4');
      console.log('Parenthesized expression with precedence result:', result);
      expect(result.success).toBe(true);
      expect(result.result).toBe('20');
    });
  });

  describe('Complex Logical Expressions', () => {
    test('should evaluate complex logical expressions', () => {
      const result = parser.evaluate('(5 > 3) && (2 < 4)');
      console.log('Complex logical expression result:', result);
      expect(result.success).toBe(true);
      expect(result.result).toBe('True');
    });
  });

  describe('Function Calls', () => {
    test('should evaluate matches function', () => {
      const result = parser.evaluate('matches("Hello", "^H.*o$")');
      console.log('Matches function result:', result);
      expect(result.success).toBe(true);
      expect(result.result).toBe('True');
    });

    test('should evaluate collection functions', () => {
      const result = parser.evaluate('filter(myCollection, {@it > 1})');
      console.log('Filter function result:', result);
      expect(result.success).toBe(true);
      expect(result.result).toBe('[2, 3]');
    });
  });

  describe('Simple Tests', () => {
    test('should evaluate expressions with variables', () => {
      const result1 = parser.evaluate('x = 10');
      expect(result1.success).toBe(true);

      const result2 = parser.evaluate('x + 5');
      expect(result2.success).toBe(true);
      expect(result2.result).toBe('15');
    });

    test('should handle multi-statement expressions', () => {
      const result = parser.evaluate('x = 5; x + 2');
      expect(result.success).toBe(true);
      expect(result.result).toBe('7');
    });

    test('should handle array access in arithmetic expressions', () => {
      const result = parser.evaluate('myCollection[0] + 2');
      expect(result.success).toBe(true);
      expect(result.result).toBe('3');
    });
  });
});
