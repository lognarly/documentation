/**
 * Expression Language Parser
 *
 * This module handles parsing and evaluating expressions for the Expression Language REPL.
 * It provides a Pythonic syntax for the Dynamic Instrumentation Expression Language.
 */

class ExpressionLanguageParser {
  constructor() {
    // Initialize the environment with default variables
    this.environment = {
      myCollection: [1, 2, 3]
    };
  }

  /**
   * Evaluate an expression and return the result
   * @param {string} expr - The expression to evaluate
   * @returns {Object} - Object with success flag and result or error
   */
  evaluate(expr) {
    if (expr.trim() === '') {
      return { success: false, error: 'Expression cannot be empty' };
    }

    try {
      // Special case for string comparison
      if (expr.match(/^"[^"]*"\s*==\s*"[^"]*"$/) || expr.match(/^'[^']*'\s*==\s*'[^']*'$/)) {
        const parts = expr.split('==').map(part => part.trim());
        const left = parts[0].substring(1, parts[0].length - 1);
        const right = parts[1].substring(1, parts[1].length - 1);
        return { success: true, result: left === right ? 'True' : 'False' };
      }

      // Handle multiple statements separated by semicolons
      if (expr.includes(';')) {
        const statements = expr.split(';').map(stmt => stmt.trim()).filter(stmt => stmt.length > 0);
        let result;

        for (const statement of statements) {
          result = this._evaluateStatement(statement);
          if (!result.success) return result;
        }

        return { success: true, result: this._formatValue(result.value) };
      }

      // Special case for filter, all, any functions
      if (expr.match(/^(filter|all|any)\s*\(\s*[a-zA-Z_][a-zA-Z0-9_]*\s*,\s*\{@it/)) {
        const match = expr.match(/^(filter|all|any)\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*,\s*\{(.+)\}\)$/);
        if (match) {
          const functionName = match[1];
          const collectionName = match[2];
          const predicate = match[3];

          if (!(collectionName in this.environment)) {
            return { success: false, error: `Variable '${collectionName}' is not defined` };
          }

          const collection = this.environment[collectionName];
          if (!Array.isArray(collection)) {
            return { success: false, error: `Variable '${collectionName}' is not an array` };
          }

          try {
            let result;
            if (functionName === 'filter') {
              result = collection.filter(item => {
                this.environment['@it'] = item;
                const evalResult = this._evaluateExpression(predicate);
                delete this.environment['@it'];
                return evalResult;
              });
            } else if (functionName === 'all') {
              result = collection.every(item => {
                this.environment['@it'] = item;
                const evalResult = this._evaluateExpression(predicate);
                delete this.environment['@it'];
                return evalResult;
              });
            } else if (functionName === 'any') {
              result = collection.some(item => {
                this.environment['@it'] = item;
                const evalResult = this._evaluateExpression(predicate);
                delete this.environment['@it'];
                return evalResult;
              });
            }

            return { success: true, result: this._formatValue(result) };
          } catch (e) {
            return { success: false, error: `Error evaluating ${functionName}(): ${e.message}` };
          }
        }
      }

      const result = this._evaluateStatement(expr);
      return { success: true, result: this._formatValue(result.value) };
    } catch (e) {
      return { success: false, error: `Error evaluating expression: ${e.message}` };
    }
  }

  /**
   * Evaluate a single statement
   * @param {string} statement - The statement to evaluate
   * @returns {Object} - Object with success flag and value
   * @private
   */
  _evaluateStatement(statement) {
    statement = statement.trim();

    // Handle variable assignment
    if (statement.includes('=') &&
        !statement.includes('==') &&
        !statement.includes('>=') &&
        !statement.includes('<=') &&
        !statement.includes('!=')) {
      const [varName, valueExpr] = statement.split('=').map(s => s.trim());
      const value = this._evaluateExpression(valueExpr);
      this.environment[varName] = value;
      return { success: true, value };
    }

    // Handle other expressions
    return { success: true, value: this._evaluateExpression(statement) };
  }

  /**
   * Evaluate an expression
   * @param {string} expr - The expression to evaluate
   * @returns {*} - The evaluated value
   * @private
   */
  _evaluateExpression(expr) {
    expr = expr.trim();

    // Handle empty expression
    if (expr === '') {
      throw new Error('Empty expression');
    }

    // Handle @it variable for collection functions
    if (expr === '@it') {
      if ('@it' in this.environment) {
        return this.environment['@it'];
      } else {
        throw new Error('Variable @it is only available within collection function predicates');
      }
    }

    // Handle @it in comparison expressions
    if (expr.includes('@it')) {
      if ('@it' in this.environment) {
        // Replace @it with its actual value for comparison
        const itValue = this.environment['@it'];

        // Handle @it > number
        const gtMatch = expr.match(/^@it\s*>\s*(\d+)$/);
        if (gtMatch) {
          const number = parseFloat(gtMatch[1]);
          return itValue > number;
        }

        // Handle @it < number
        const ltMatch = expr.match(/^@it\s*<\s*(\d+)$/);
        if (ltMatch) {
          const number = parseFloat(ltMatch[1]);
          return itValue < number;
        }

        // Handle @it >= number
        const gteMatch = expr.match(/^@it\s*>=\s*(\d+)$/);
        if (gteMatch) {
          const number = parseFloat(gteMatch[1]);
          return itValue >= number;
        }

        // Handle @it <= number
        const lteMatch = expr.match(/^@it\s*<=\s*(\d+)$/);
        if (lteMatch) {
          const number = parseFloat(lteMatch[1]);
          return itValue <= number;
        }

        // Handle @it == number
        const eqMatch = expr.match(/^@it\s*==\s*(\d+)$/);
        if (eqMatch) {
          const number = parseFloat(eqMatch[1]);
          return itValue == number;
        }

        // Handle @it != number
        const neqMatch = expr.match(/^@it\s*!=\s*(\d+)$/);
        if (neqMatch) {
          const number = parseFloat(neqMatch[1]);
          return itValue != number;
        }
      } else {
        throw new Error('Variable @it is only available within collection function predicates');
      }
    }

    // Handle boolean literals
    if (expr === 'true' || expr === 'True') {
      return true;
    }

    if (expr === 'false' || expr === 'False') {
      return false;
    }

    // Special case for complex expressions with parentheses and operators
    if (expr.includes('(') && expr.includes(')')) {
      // Handle (2 + 3) * 4 type expressions
      if (expr.match(/^\([^()]+\)\s*[\*\/\+\-]\s*.+$/)) {
        const closingParenIndex = expr.indexOf(')');
        const operatorIndex = expr.substring(closingParenIndex).search(/[\*\/\+\-]/);

        if (operatorIndex !== -1) {
          const operator = expr.substring(closingParenIndex)[operatorIndex].trim();
          const leftExpr = expr.substring(0, closingParenIndex + 1);
          const rightExpr = expr.substring(closingParenIndex + operatorIndex + 1);

          const leftValue = this._evaluateExpression(leftExpr);
          const rightValue = this._evaluateExpression(rightExpr);

          switch (operator) {
            case '*': return leftValue * rightValue;
            case '/': return leftValue / rightValue;
            case '+': return leftValue + rightValue;
            case '-': return leftValue - rightValue;
            default: throw new Error(`Unknown operator: ${operator}`);
          }
        }
      }

      // Handle complex logical expressions like (5 > 3) && (2 < 4)
      if (expr.match(/^\([^()]+\)\s*(\&\&|\|\|)\s*\([^()]+\)$/)) {
        const match = expr.match(/^(\([^()]+\))\s*(\&\&|\|\|)\s*(\([^()]+\))$/);
        if (match) {
          const leftExpr = match[1];
          const operator = match[2];
          const rightExpr = match[3];

          const leftValue = this._evaluateExpression(leftExpr);

          // Short-circuit evaluation
          if (operator === '&&' && !leftValue) return false;
          if (operator === '||' && leftValue) return true;

          const rightValue = this._evaluateExpression(rightExpr);

          return operator === '&&' ? leftValue && rightValue : leftValue || rightValue;
        }
      }
    }

    // Handle simple parenthesized expressions
    if (expr.startsWith('(') && expr.endsWith(')')) {
      return this._evaluateExpression(expr.substring(1, expr.length - 1));
    }

    // Handle string literals
    if ((expr.startsWith('"') && expr.endsWith('"')) ||
        (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.substring(1, expr.length - 1);
    }

    // Handle array literals
    if (expr.startsWith('[') && expr.endsWith(']')) {
      const content = expr.substring(1, expr.length - 1).trim();
      if (content === '') {
        return [];
      }

      return content.split(',').map(item => this._evaluateExpression(item.trim()));
    }

    // Handle array access
    const arrayAccessMatch = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\[(\d+)\]$/);
    if (arrayAccessMatch) {
      const varName = arrayAccessMatch[1];
      const index = parseInt(arrayAccessMatch[2]);

      if (!(varName in this.environment)) {
        throw new Error(`Variable '${varName}' is not defined`);
      }

      const array = this.environment[varName];
      if (!Array.isArray(array)) {
        throw new Error(`Variable '${varName}' is not an array`);
      }

      if (index >= array.length) {
        throw new Error(`Index out of bounds: ${index}`);
      }

      return array[index];
    }

    // Handle function calls
    if (expr.includes('(') && expr.endsWith(')')) {
      return this._evaluateFunctionCall(expr);
    }

    // Handle comparison expressions (check these before arithmetic)
    if (expr.includes('==')) {
      const [left, right] = this._splitExpression(expr, '==');
      const leftValue = this._evaluateExpression(left);
      const rightValue = this._evaluateExpression(right);
      return leftValue === rightValue;
    }

    if (expr.includes('!=')) {
      const [left, right] = this._splitExpression(expr, '!=');
      const leftValue = this._evaluateExpression(left);
      const rightValue = this._evaluateExpression(right);
      return leftValue !== rightValue;
    }

    if (expr.includes('>=')) {
      const [left, right] = this._splitExpression(expr, '>=');
      const leftValue = this._evaluateExpression(left);
      const rightValue = this._evaluateExpression(right);
      return leftValue >= rightValue;
    }

    if (expr.includes('<=')) {
      const [left, right] = this._splitExpression(expr, '<=');
      const leftValue = this._evaluateExpression(left);
      const rightValue = this._evaluateExpression(right);
      return leftValue <= rightValue;
    }

    if (expr.includes('>')) {
      const [left, right] = this._splitExpression(expr, '>');
      const leftValue = this._evaluateExpression(left);
      const rightValue = this._evaluateExpression(right);
      return leftValue > rightValue;
    }

    if (expr.includes('<')) {
      const [left, right] = this._splitExpression(expr, '<');
      const leftValue = this._evaluateExpression(left);
      const rightValue = this._evaluateExpression(right);
      return leftValue < rightValue;
    }

    // Handle arithmetic expressions
    if (expr.includes('+')) {
      const [left, right] = this._splitExpression(expr, '+');
      return this._evaluateExpression(left) + this._evaluateExpression(right);
    }

    if (expr.includes('-') && !expr.startsWith('-')) {
      const [left, right] = this._splitExpression(expr, '-');
      return this._evaluateExpression(left) - this._evaluateExpression(right);
    }

    if (expr.includes('*')) {
      const [left, right] = this._splitExpression(expr, '*');
      return this._evaluateExpression(left) * this._evaluateExpression(right);
    }

    if (expr.includes('/')) {
      const [left, right] = this._splitExpression(expr, '/');
      const rightValue = this._evaluateExpression(right);

      if (rightValue === 0) {
        throw new Error('Division by zero');
      }

      return this._evaluateExpression(left) / rightValue;
    }

    // Handle logical expressions
    if (expr.includes('&&')) {
      const [left, right] = this._splitExpression(expr, '&&');
      return this._evaluateExpression(left) && this._evaluateExpression(right);
    }

    if (expr.includes('||')) {
      const [left, right] = this._splitExpression(expr, '||');
      return this._evaluateExpression(left) || this._evaluateExpression(right);
    }

    if (expr.startsWith('!') || expr.startsWith('not ')) {
      const operand = expr.startsWith('!') ? expr.substring(1) : expr.substring(4);
      return !this._evaluateExpression(operand);
    }

    // Handle numeric literals
    if (!isNaN(parseFloat(expr))) {
      return parseFloat(expr);
    }

    // Handle variable references
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expr)) {
      if (expr in this.environment) {
        return this.environment[expr];
      } else {
        throw new Error(`Variable '${expr}' is not defined`);
      }
    }

    throw new Error(`Unknown expression: ${expr}`);
  }

  /**
   * Evaluate a function call
   * @param {string} expr - The function call expression
   * @returns {*} - The result of the function call
   * @private
   */
  _evaluateFunctionCall(expr) {
    const openParenIndex = expr.indexOf('(');
    const functionName = expr.substring(0, openParenIndex).trim();

    // Find the closing parenthesis, respecting nested parentheses
    let closeParenIndex = expr.length - 1;
    let parenDepth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = openParenIndex + 1; i < expr.length; i++) {
      const char = expr[i];

      // Handle strings
      if ((char === '"' || char === "'") && (i === 0 || expr[i - 1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (!inString) {
        if (char === '(') {
          parenDepth++;
        } else if (char === ')') {
          if (parenDepth === 0) {
            closeParenIndex = i;
            break;
          }
          parenDepth--;
        }
      }
    }

    const argsString = expr.substring(openParenIndex + 1, closeParenIndex).trim();

    // Special handling for collection functions (filter, all, any)
    if (['filter', 'all', 'any'].includes(functionName) && argsString.includes('{@it')) {
      // Split the arguments at the first comma
      const commaIndex = argsString.indexOf(',');
      if (commaIndex === -1) {
        throw new Error(`${functionName}() requires two arguments`);
      }

      const collectionExpr = argsString.substring(0, commaIndex).trim();
      const predicateExpr = argsString.substring(commaIndex + 1).trim();

      // Validate the predicate format
      if (!predicateExpr.startsWith('{') || !predicateExpr.endsWith('}')) {
        throw new Error(`${functionName}() predicate must be enclosed in {}`);
      }

      // Extract the predicate expression
      const predicate = predicateExpr.substring(1, predicateExpr.length - 1).trim();

      // Evaluate the collection
      const collection = this._evaluateExpression(collectionExpr);

      if (!Array.isArray(collection)) {
        throw new Error(`${functionName}() first argument must be an array`);
      }

      // Apply the predicate to each item
      if (functionName === 'filter') {
        return collection.filter(item => {
          // Set @it to the current item
          this.environment['@it'] = item;
          try {
            const result = this._evaluateExpression(predicate);
            return result;
          } finally {
            // Clean up
            delete this.environment['@it'];
          }
        });
      } else if (functionName === 'all') {
        return collection.every(item => {
          this.environment['@it'] = item;
          try {
            return this._evaluateExpression(predicate);
          } finally {
            delete this.environment['@it'];
          }
        });
      } else if (functionName === 'any') {
        return collection.some(item => {
          this.environment['@it'] = item;
          try {
            return this._evaluateExpression(predicate);
          } finally {
            delete this.environment['@it'];
          }
        });
      }
    }

    // For other functions, parse arguments normally
    const args = argsString === '' ? [] : this._parseArguments(argsString);

    // Evaluate function
    switch (functionName) {
      case 'len':
        if (args.length !== 1) {
          throw new Error('len() requires exactly one argument');
        }

        if (typeof args[0] === 'string' || Array.isArray(args[0])) {
          return args[0].length;
        } else {
          throw new Error('len() argument must be a string or array');
        }

      case 'contains':
        if (args.length !== 2) {
          throw new Error('contains() requires exactly two arguments');
        }

        if (typeof args[0] === 'string' && typeof args[1] === 'string') {
          return args[0].includes(args[1]);
        } else if (Array.isArray(args[0])) {
          return args[0].includes(args[1]);
        } else {
          throw new Error('contains() first argument must be a string or array');
        }

      case 'startsWith':
        if (args.length !== 2) {
          throw new Error('startsWith() requires exactly two arguments');
        }

        if (typeof args[0] === 'string' && typeof args[1] === 'string') {
          return args[0].startsWith(args[1]);
        } else {
          throw new Error('startsWith() arguments must be strings');
        }

      case 'endsWith':
        if (args.length !== 2) {
          throw new Error('endsWith() requires exactly two arguments');
        }

        if (typeof args[0] === 'string' && typeof args[1] === 'string') {
          return args[0].endsWith(args[1]);
        } else {
          throw new Error('endsWith() arguments must be strings');
        }

      case 'substring':
        if (args.length !== 3) {
          throw new Error('substring() requires exactly three arguments');
        }

        if (typeof args[0] === 'string' && typeof args[1] === 'number' && typeof args[2] === 'number') {
          return args[0].substring(args[1], args[2]);
        } else {
          throw new Error('substring() invalid arguments');
        }

      case 'isEmpty':
        if (args.length !== 1) {
          throw new Error('isEmpty() requires exactly one argument');
        }

        if (typeof args[0] === 'string' || Array.isArray(args[0])) {
          return args[0].length === 0;
        } else {
          throw new Error('isEmpty() argument must be a string or array');
        }

      case 'matches':
        if (args.length !== 2) {
          throw new Error('matches() requires exactly two arguments');
        }

        if (typeof args[0] === 'string' && typeof args[1] === 'string') {
          try {
            const regex = new RegExp(args[1]);
            return regex.test(args[0]);
          } catch (e) {
            throw new Error(`Invalid regex pattern: ${e.message}`);
          }
        } else {
          throw new Error('matches() arguments must be strings');
        }

      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }

  /**
   * Parse function arguments
   * @param {string} argsString - The arguments string
   * @returns {Array} - The parsed arguments
   * @private
   */
  _parseArguments(argsString) {
    // Special case for filter, all, any functions
    if (argsString.includes('{@it')) {
      const commaIndex = argsString.indexOf(',');
      if (commaIndex === -1) {
        throw new Error('Invalid function arguments');
      }

      const firstArg = argsString.substring(0, commaIndex).trim();
      const predicateExpr = argsString.substring(commaIndex + 1).trim();

      if (!predicateExpr.startsWith('{') || !predicateExpr.endsWith('}')) {
        throw new Error('Predicate must be enclosed in {}');
      }

      const predicate = predicateExpr.substring(1, predicateExpr.length - 1).trim();

      // For filter, all, any functions, we need to handle @it specially
      // We'll temporarily add @it to the environment when evaluating the predicate
      const firstArgValue = this._evaluateExpression(firstArg);

      // Return the collection and the predicate
      return [
        firstArgValue,
        { '@predicate': predicate }
      ];
    }

    // Regular arguments
    const args = [];
    let currentArg = '';
    let inString = false;
    let stringChar = '';
    let parenDepth = 0;

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      // Handle strings
      if ((char === '"' || char === "'") && (i === 0 || argsString[i - 1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      // Handle parentheses
      if (!inString) {
        if (char === '(') {
          parenDepth++;
        } else if (char === ')') {
          parenDepth--;
        }
      }

      // Handle commas
      if (char === ',' && !inString && parenDepth === 0) {
        args.push(this._evaluateExpression(currentArg.trim()));
        currentArg = '';
        continue;
      }

      currentArg += char;
    }

    if (currentArg.trim() !== '') {
      args.push(this._evaluateExpression(currentArg.trim()));
    }

    return args;
  }

  /**
   * Split an expression by an operator
   * @param {string} expr - The expression to split
   * @param {string} operator - The operator to split by
   * @returns {Array} - The left and right parts of the expression
   * @private
   */
  _splitExpression(expr, operator) {
    let inString = false;
    let stringChar = '';
    let parenDepth = 0;

    // For complex expressions like (2 + 3) * 4, we need special handling
    if (operator === '*' && expr.includes('(') && expr.includes(')')) {
      // Check if this is a parenthesized expression with multiplication
      const parenCloseIndex = expr.lastIndexOf(')');
      const multIndex = expr.indexOf('*', parenCloseIndex);

      if (multIndex > 0) {
        return [
          expr.substring(0, multIndex).trim(),
          expr.substring(multIndex + 1).trim()
        ];
      }
    }

    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];

      // Handle strings
      if ((char === '"' || char === "'") && (i === 0 || expr[i - 1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      // Handle parentheses
      if (!inString) {
        if (char === '(') {
          parenDepth++;
        } else if (char === ')') {
          parenDepth--;
        }
      }

      // Check for operator
      if (!inString && parenDepth === 0) {
        if (expr.substring(i, i + operator.length) === operator) {
          return [
            expr.substring(0, i).trim(),
            expr.substring(i + operator.length).trim()
          ];
        }
      }
    }

    // Special case for complex logical expressions like (5 > 3) && (2 < 4)
    if (operator === '&&' || operator === '||') {
      // Try to find the operator between parenthesized expressions
      const parts = expr.split(operator);
      if (parts.length === 2) {
        return [parts[0].trim(), parts[1].trim()];
      }
    }

    throw new Error(`Operator '${operator}' not found in expression: ${expr}`);
  }

  /**
   * Format a value for display
   * @param {*} value - The value to format
   * @returns {string} - The formatted value
   * @private
   */
  _formatValue(value) {
    if (value === undefined) {
      return 'undefined';
    } else if (value === null) {
      return 'null';
    } else if (typeof value === 'boolean') {
      return value ? 'True' : 'False';
    } else if (typeof value === 'string') {
      return `"${value}"`;
    } else if (Array.isArray(value)) {
      const formattedItems = value.map(item => this._formatValue(item));
      return `[${formattedItems.join(', ')}]`;
    } else {
      return String(value);
    }
  }
}

export default ExpressionLanguageParser;
