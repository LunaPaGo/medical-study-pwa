type CalculatorFormulaProps = {
  title?: string;
  formulas: string[];
};

export function CalculatorFormula({ title = 'Fórmula utilizada', formulas }: CalculatorFormulaProps) {
  return (
    <section className="calculator-info-block calculator-formula">
      <span>{title}</span>
      {formulas.map((formula) => (
        <strong key={formula}>{formula}</strong>
      ))}
    </section>
  );
}
