import type { CalculatorCategory } from './calculatorCatalog';

type CalculatorCategoryPanelProps = {
  category: CalculatorCategory;
};

export function CalculatorCategoryPanel({ category }: CalculatorCategoryPanelProps) {
  return (
    <details className="panel calculator-category-panel">
      <summary>{category.title}</summary>
      <div className="calculator-category-body">
        {category.calculators.length === 0 ? (
          <p className="empty-state">Aún no hay calculadoras disponibles.</p>
        ) : (
          <div className="calculator-card-grid">
            {category.calculators.map((calculator) => (
              <article className="calculator-card" key={calculator.id}>
                <h2>{calculator.title}</h2>
                <calculator.component />
              </article>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
