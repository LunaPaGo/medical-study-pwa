type CalculatorInfoProps = {
  title: string;
  children: React.ReactNode;
};

export function CalculatorInfo({ title, children }: CalculatorInfoProps) {
  return (
    <section className="calculator-info-block">
      <span>{title}</span>
      <p>{children}</p>
    </section>
  );
}
