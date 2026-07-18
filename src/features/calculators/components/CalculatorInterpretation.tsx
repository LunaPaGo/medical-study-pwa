type CalculatorInterpretationProps = {
  children: React.ReactNode;
};

export function CalculatorInterpretation({ children }: CalculatorInterpretationProps) {
  return (
    <section className="calculator-info-block calculator-interpretation">
      <span>Interpretación de valores</span>
      <div>{children}</div>
    </section>
  );
}
