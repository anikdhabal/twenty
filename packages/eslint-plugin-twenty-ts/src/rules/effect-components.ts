import { Rule } from 'eslint';
import { TSESTree } from "@typescript-eslint/utils";

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Effect components should end with the Effect suffix. This rule checks only components that are in PascalCase and that return a JSX fragment or null. Any renderProps or camelCase components are ignored.',
      category: 'Stylistic Issues',
      recommended: true,
      url: 'https://docs.twenty.com',
    },
    messages: {
      effectSuffix:
        'Effect component {{ componentName }} should end with the Effect suffix.',
      noEffectSuffix:
        'Component {{ componentName }} shouldn\'t end with the Effect suffix because it doesn\'t return a JSX fragment or null.',
    },
    fixable: 'code',
  },
  create(context: Rule.RuleContext) {
    function checkThatNodeIsEffectComponent(
      node:
        | TSESTree.FunctionDeclaration
        | TSESTree.ArrowFunctionExpression
        | TSESTree.FunctionExpression
    ) {
      const isPascalCase = /^[A-Z][a-zA-Z]*$/.test(node.id?.name || '');

      if (!isPascalCase) {
        return;
      }

      const isReturningFragmentOrNull =
        // Direct return of JSX fragment, e.g., () => <></>
        (node.body?.type === 'JSXFragment' && node.body.children.length === 0) ||
        // Direct return of null, e.g., () => null
        (node.body?.type === 'Literal' && node.body.value === null) ||
        // Return JSX fragment or null from block
        (node.body?.type === 'BlockStatement' &&
          node.body.body.some((statement) =>
            statement.type === 'ReturnStatement' &&
            (
              // Empty JSX fragment return, e.g., return <></>;
              (statement.argument?.type === 'JSXFragment' &&
                statement.argument.children.length === 0) ||
              // Empty React.Fragment return, e.g., return <React.Fragment></React.Fragment>;
              (statement.argument?.type === 'JSXElement' &&
                statement.argument.openingElement.name.type === 'JSXIdentifier' &&
                statement.argument.openingElement.name.name === 'React.Fragment' &&
                statement.argument.children.length === 0) ||
              // Literal null return, e.g., return null;
              (statement.argument?.type === 'Literal' && statement.argument.value === null)
            )
          ));

      const hasEffectSuffix = node.id?.name.endsWith('Effect');

      const hasEffectSuffixButIsNotEffectComponent =
        hasEffectSuffix && !isReturningFragmentOrNull;
      const isEffectComponentButDoesNotHaveEffectSuffix =
        !hasEffectSuffix && isReturningFragmentOrNull;

      if (isEffectComponentButDoesNotHaveEffectSuffix) {
        context.report({
          node,
          messageId: 'effectSuffix',
          data: {
            componentName: node.id?.name,
          },
          fix(fixer) {
            if (node.id) {
              return fixer.replaceText(
                node.id,
                node.id?.name + 'Effect'
              );
            }

            return null;
          },
        });
      } else if (hasEffectSuffixButIsNotEffectComponent) {
        context.report({
          node,
          messageId: 'noEffectSuffix',
          data: {
            componentName: node.id?.name,
          },
          fix(fixer) {
            if (node.id) {
              return fixer.replaceText(
                node.id,
                node.id?.name.replace('Effect', '')
              );
            }

            return null;
          },
        });
      }
    }

    return {
      ArrowFunctionExpression: checkThatNodeIsEffectComponent,
      FunctionDeclaration: checkThatNodeIsEffectComponent,
      FunctionExpression: checkThatNodeIsEffectComponent,
    };
  },
}

export default rule;
