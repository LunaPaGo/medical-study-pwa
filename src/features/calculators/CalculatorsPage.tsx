import { CalculatorCategoryPanel } from './CalculatorCategoryPanel';
import { calculatorCategories } from './calculatorCatalog';

export function CalculatorsPage() {
  return (
    <section className="page-stack">
      <div className="page-heading">
        <span>Herramientas clínicas</span>
        <h1>Calculadoras</h1>
        <p>Contenedores preparados para futuras calculadoras médicas independientes.</p>
      </div>

      <div className="calculator-category-stack">
        {calculatorCategories.map((category) => (
          <CalculatorCategoryPanel category={category} key={category.id} />
        ))}
      </div>
    </section>
  );
}
