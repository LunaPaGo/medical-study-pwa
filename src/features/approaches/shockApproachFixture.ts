import type { TipTapDocument } from '../../types/topic';
import type { ClinicalApproach, ClinicalApproachContent, ComplementaryStudy, DecisionTree, DifferentialDiagnosisItem, ReasoningItem } from './clinicalApproachTypes';
import { validateDecisionTree } from './decisionTreeValidation';

type TextBlock = { kind: 'paragraph' | 'heading'; text: string } | { kind: 'bullet'; items: string[] };
type ShockApproachBaseContent = Pick<ClinicalApproachContent,
  'version' | 'presentation' | 'initialAssessment' | 'lifeThreats' | 'anamnesis' | 'physicalExam'
  | 'differentialDiagnosis' | 'complementaryStudies' | 'initialTreatment' | 'reassessment' | 'disposition'
  | 'warningsAndInstructions' | 'commonErrors' | 'clinicalPearls'
>;

const textNode = (text: string) => ({ type: 'text', text });
const richText = (...blocks: TextBlock[]): TipTapDocument => ({
  type: 'doc',
  content: blocks.map((block) => block.kind === 'bullet'
    ? { type: 'bulletList', content: block.items.map((item) => ({ type: 'listItem', content: [{ type: 'paragraph', content: [textNode(item)] }] })) }
    : { type: block.kind, ...(block.kind === 'heading' ? { attrs: { level: 3 } } : {}), content: [textNode(block.text)] })
});
const paragraph = (text: string): TipTapDocument => richText({ kind: 'paragraph', text });
const stableId = (group: number, index: number) => `5a0c${group.toString().padStart(4, '0')}-0000-4000-8000-${index.toString().padStart(12, '0')}`;
const reasoning = (group: number, entries: Array<[string, string, string]>): ReasoningItem[] => entries.map(([title, content, whyItMatters], index) => ({
  id: stableId(group, index + 1), title, content: paragraph(content), whyItMatters: paragraph(whyItMatters)
}));
const differentials = (group: number, entries: Array<[string, string]>): DifferentialDiagnosisItem[] => entries.map(([title, explanation], index) => ({
  id: stableId(group, index + 1), title, explanation: paragraph(explanation)
}));
const studies = (entries: Array<[string, string, string, string]>): ComplementaryStudy[] => entries.map(([name, whenToOrder, targetFinding, interpretation], index) => ({
  id: stableId(6, index + 1), name, whenToOrder: paragraph(whenToOrder), targetFinding: paragraph(targetFinding), interpretation: paragraph(interpretation)
}));

export const SHOCK_APPROACH_TITLE = 'Shock';
export const SHOCK_APPROACH_DESCRIPTION = 'Abordaje del paciente con hipoperfusión tisular aguda y riesgo de falla orgánica, orientado al reconocimiento precoz del shock, estabilización inmediata, identificación del mecanismo predominante —hipovolémico, distributivo, cardiogénico u obstructivo—, tratamiento de causas reversibles y reevaluación hemodinámica seriada.';

export function createShockApproachBaseContent(): ShockApproachBaseContent {
  return {
    version: 1,
    presentation: richText(
      { kind: 'paragraph', text: 'El shock es un estado de insuficiencia circulatoria aguda en el que la entrega de oxígeno y sustratos resulta inadecuada para las necesidades tisulares, con riesgo de disfunción celular y falla orgánica.' },
      { kind: 'paragraph', text: 'No debe definirse exclusivamente por hipotensión arterial. Un paciente puede encontrarse en shock con una presión arterial inicialmente conservada si presenta signos de hipoperfusión.' },
      { kind: 'paragraph', text: 'El reconocimiento clínico debe integrar:' },
      { kind: 'bullet', items: ['estado mental', 'presión arterial y presión arterial media', 'frecuencia cardíaca y ritmo', 'perfusión periférica', 'relleno capilar', 'temperatura y coloración de extremidades', 'diuresis', 'lactato cuando corresponda', 'signos de congestión', 'trabajo respiratorio', 'función de órganos', 'respuesta a intervenciones'] },
      { kind: 'paragraph', text: 'Las cuatro categorías fisiopatológicas principales son:' },
      { kind: 'heading', text: '1. Shock hipovolémico' },
      { kind: 'paragraph', text: 'Reducción del volumen circulante efectivo por hemorragia o pérdida de líquidos.' },
      { kind: 'heading', text: '2. Shock distributivo' },
      { kind: 'paragraph', text: 'Vasodilatación y mala distribución del flujo. La sepsis es la causa más frecuente, pero también incluye anafilaxia, shock neurogénico y otros estados vasopléjicos.' },
      { kind: 'heading', text: '3. Shock cardiogénico' },
      { kind: 'paragraph', text: 'Falla primaria de la bomba cardíaca con gasto insuficiente, habitualmente asociada a signos de congestión o elevación de presiones de llenado.' },
      { kind: 'heading', text: '4. Shock obstructivo' },
      { kind: 'paragraph', text: 'Impedimento mecánico al llenado o eyección cardíaca, como tromboembolismo pulmonar de alto riesgo, taponamiento cardíaco o neumotórax a tensión.' },
      { kind: 'paragraph', text: 'Los mecanismos pueden coexistir. Por ejemplo, un paciente séptico puede desarrollar disfunción miocárdica; un paciente hemorrágico puede tener cardiopatía previa; un paciente con shock cardiogénico puede estar además hipovolémico.' },
      { kind: 'paragraph', text: 'Las preguntas iniciales deben ser:' },
      { kind: 'bullet', items: ['¿El paciente está realmente en shock?', '¿Cuál es el mecanismo predominante?', '¿Existe una causa inmediatamente reversible?', '¿Hay hemorragia activa?', '¿Hay vasodilatación/distributivo?', '¿Hay falla de bomba?', '¿Hay obstrucción mecánica?', '¿Necesita fluidos?', '¿Responderá a fluidos?', '¿Necesita vasopresores?', '¿Necesita inotrópicos?', '¿Hay que realizar un procedimiento urgente?', '¿La respuesta a las medidas iniciales confirma o contradice la hipótesis?'] },
      { kind: 'paragraph', text: 'El enfoque debe ser dinámico. El diagnóstico hemodinámico puede cambiar durante la evolución y después de cada intervención.' }
    ),
    initialAssessment: richText(
      { kind: 'paragraph', text: 'Realizar evaluación simultánea de ABCDE, perfusión, mecanismo probable y causas reversibles.' },
      { kind: 'heading', text: 'A — Vía aérea' },
      { kind: 'paragraph', text: 'Evaluar:' },
      { kind: 'bullet', items: ['permeabilidad', 'capacidad para proteger la vía aérea', 'nivel de conciencia', 'riesgo de aspiración', 'agotamiento'] },
      { kind: 'paragraph', text: 'Considerar intubación cuando exista incapacidad para proteger la vía aérea, hipoxemia refractaria, trabajo respiratorio extremo, deterioro neurológico o agotamiento.' },
      { kind: 'paragraph', text: 'Tener en cuenta que la inducción anestésica y la ventilación con presión positiva pueden precipitar colapso hemodinámico en pacientes con shock profundo, especialmente en hipovolemia, taponamiento, TEP grave o falla ventricular derecha.' },
      { kind: 'paragraph', text: 'Preparar la vía aérea como un procedimiento hemodinámicamente de alto riesgo.' },
      { kind: 'heading', text: 'B — Respiración' },
      { kind: 'paragraph', text: 'Evaluar:' },
      { kind: 'bullet', items: ['frecuencia respiratoria', 'saturación', 'patrón respiratorio', 'trabajo respiratorio', 'expansión torácica', 'auscultación', 'simetría', 'signos de neumotórax', 'edema pulmonar', 'posible TEP'] },
      { kind: 'paragraph', text: 'La taquipnea puede reflejar hipoxemia, acidosis metabólica, edema pulmonar o compensación del shock.' },
      { kind: 'heading', text: 'C — Circulación' },
      { kind: 'paragraph', text: 'Evaluar inmediatamente:' },
      { kind: 'bullet', items: ['presión arterial', 'PAM', 'frecuencia cardíaca', 'ritmo', 'pulsos centrales y periféricos', 'relleno capilar', 'temperatura de extremidades', 'moteado', 'ingurgitación yugular', 'edema/congestión', 'diuresis', 'hemorragia visible', 'signos de sangrado oculto', 'respuesta a bolos o maniobras dinámicas cuando corresponda'] },
      { kind: 'paragraph', text: 'Obtener acceso vascular adecuado y monitorización.' },
      { kind: 'paragraph', text: 'No retrasar un vasopresor necesario por esperar un acceso venoso central si existe una vía periférica adecuada y monitorizada.' },
      { kind: 'heading', text: 'D — Neurológico' },
      { kind: 'paragraph', text: 'Evaluar:' },
      { kind: 'bullet', items: ['conciencia', 'orientación', 'atención', 'agitación', 'somnolencia', 'focalidad', 'convulsiones', 'glucemia cuando corresponda'] },
      { kind: 'paragraph', text: 'La alteración aguda del estado mental puede ser una manifestación temprana de hipoperfusión cerebral.' },
      { kind: 'heading', text: 'E — Exposición' },
      { kind: 'paragraph', text: 'Buscar causas reversibles y pistas etiológicas:' },
      { kind: 'bullet', items: ['hemorragia externa', 'trauma', 'abdomen distendido o doloroso', 'pelvis inestable', 'sangrado digestivo', 'sangrado gineco-obstétrico', 'urticaria/angioedema', 'signos de infección', 'lesiones cutáneas', 'ingurgitación yugular', 'asimetría respiratoria', 'edema unilateral de miembro inferior', 'signos de taponamiento', 'signos de insuficiencia cardíaca', 'dispositivos y accesos'] },
      { kind: 'heading', text: 'Identificación de hipoperfusión' },
      { kind: 'paragraph', text: 'Buscar:' },
      { kind: 'bullet', items: ['alteración del estado mental', 'piel fría o moteada', 'relleno capilar prolongado', 'oliguria', 'hipotensión', 'PAM baja', 'taquicardia o bradicardia inapropiada', 'lactato elevado en contexto compatible', 'acidosis metabólica', 'aumento del trabajo respiratorio', 'signos de falla orgánica'] },
      { kind: 'paragraph', text: 'No utilizar un único parámetro como definición universal.' },
      { kind: 'paragraph', text: 'El lactato elevado puede apoyar gravedad e hipoperfusión, pero no es específico de hipovolemia ni de shock.' },
      { kind: 'heading', text: 'Evaluación hemodinámica inicial' },
      { kind: 'paragraph', text: 'Intentar definir en paralelo:' },
      { kind: 'heading', text: '1. Precarga / volumen efectivo' },
      { kind: 'paragraph', text: '¿Hay evidencia de pérdida de volumen o de congestión?' },
      { kind: 'heading', text: '2. Bomba' },
      { kind: 'paragraph', text: '¿Existe disfunción ventricular izquierda o derecha?' },
      { kind: 'heading', text: '3. Tono vascular' },
      { kind: 'paragraph', text: '¿Predomina vasodilatación?' },
      { kind: 'heading', text: '4. Obstrucción' },
      { kind: 'paragraph', text: '¿Existe una barrera mecánica al llenado o eyección?' },
      { kind: 'heading', text: '5. Respuesta a fluidos' },
      { kind: 'paragraph', text: '¿Es probable que un aumento de precarga produzca aumento relevante del volumen sistólico?' },
      { kind: 'paragraph', text: 'Cuando esté disponible y exista entrenamiento, utilizar POCUS como extensión del examen físico para integrar:' },
      { kind: 'bullet', items: ['función ventricular izquierda', 'tamaño y función del ventrículo derecho', 'derrame pericárdico/taponamiento', 'congestión', 'edema pulmonar', 'neumotórax', 'vena cava en contexto', 'líquido libre', 'aorta', 'causas focales'] },
      { kind: 'paragraph', text: 'No utilizar un único parámetro ecográfico aislado como sustituto de la evaluación clínica.' }
    ),
    lifeThreats: richText(
      { kind: 'paragraph', text: 'Las principales causas que deben identificarse o tratarse de inmediato incluyen:' },
      { kind: 'bullet', items: ['hemorragia masiva', 'shock séptico', 'anafilaxia', 'infarto agudo de miocardio complicado con shock cardiogénico', 'arritmia inestable', 'insuficiencia ventricular derecha aguda', 'tromboembolismo pulmonar de alto riesgo', 'taponamiento cardíaco', 'neumotórax a tensión', 'disección aórtica rota o complicada', 'aneurisma de aorta roto', 'hemorragia digestiva masiva', 'hemorragia obstétrica', 'embarazo ectópico roto', 'sepsis con foco que requiere control urgente', 'crisis suprarrenal', 'shock neurogénico', 'intoxicaciones con compromiso cardiovascular', 'trauma con shock oculto', 'falla multiorgánica progresiva'] },
      { kind: 'heading', text: 'Hemorragia masiva' },
      { kind: 'paragraph', text: 'La pérdida sanguínea significativa puede producir shock antes de que la hemoglobina inicial refleje la magnitud real. Buscar sangrado externo y oculto.' },
      { kind: 'paragraph', text: 'La prioridad es controlar la hemorragia, activar protocolos transfusionales cuando corresponda y evitar retrasos por estudios no esenciales.' },
      { kind: 'heading', text: 'Shock séptico' },
      { kind: 'paragraph', text: 'Considerar ante infección sospechada o confirmada con hipoperfusión y necesidad de vasopresores. El tratamiento incluye antimicrobianos oportunos, fluidos individualizados, norepinefrina y control del foco.' },
      { kind: 'heading', text: 'Anafilaxia' },
      { kind: 'paragraph', text: 'Shock de inicio agudo asociado a exposición compatible y compromiso respiratorio, cutáneo, gastrointestinal o cardiovascular.' },
      { kind: 'paragraph', text: 'La adrenalina intramuscular es el tratamiento de primera línea y no debe retrasarse.' },
      { kind: 'heading', text: 'Shock cardiogénico por síndrome coronario agudo' },
      { kind: 'paragraph', text: 'Dolor torácico, cambios ECG, elevación de biomarcadores o deterioro súbito con congestión/hipoperfusión requieren evaluación urgente para reperfusión y soporte hemodinámico.' },
      { kind: 'heading', text: 'Arritmia inestable' },
      { kind: 'paragraph', text: 'Taquiarritmias o bradiarritmias pueden ser causa o consecuencia del shock.' },
      { kind: 'paragraph', text: 'Cuando la arritmia produce inestabilidad, tratarla de acuerdo con protocolos de reanimación.' },
      { kind: 'heading', text: 'TEP de alto riesgo' },
      { kind: 'paragraph', text: 'Sospechar ante shock, hipoxemia, síncope, dolor torácico, factores de riesgo trombóticos o signos de sobrecarga ventricular derecha.' },
      { kind: 'paragraph', text: 'Puede requerir reperfusión urgente según contexto.' },
      { kind: 'heading', text: 'Taponamiento cardíaco' },
      { kind: 'paragraph', text: 'Hipotensión, ingurgitación yugular, taquicardia y derrame pericárdico con compromiso hemodinámico requieren drenaje urgente.' },
      { kind: 'heading', text: 'Neumotórax a tensión' },
      { kind: 'paragraph', text: 'Shock con deterioro respiratorio, asimetría ventilatoria y hallazgos compatibles requiere descompresión inmediata cuando la sospecha clínica es alta. No retrasar tratamiento por imagen si el diagnóstico es clínicamente evidente.' },
      { kind: 'heading', text: 'Aneurisma de aorta roto' },
      { kind: 'paragraph', text: 'Dolor abdominal/lumbar, masa pulsátil, hipotensión o shock en paciente de riesgo obliga a evaluación vascular inmediata.' },
      { kind: 'heading', text: 'Hemorragia obstétrica' },
      { kind: 'paragraph', text: 'La hemorragia posparto, embarazo ectópico roto y otras causas gineco-obstétricas pueden producir shock rápidamente. Control de sangrado y reanimación deben avanzar en paralelo.' },
      { kind: 'heading', text: 'Crisis suprarrenal' },
      { kind: 'paragraph', text: 'Puede presentarse con hipotensión refractaria, alteraciones electrolíticas, hipoglucemia y síntomas inespecíficos. Considerar especialmente ante antecedente de insuficiencia suprarrenal o uso crónico de corticoides.' },
      { kind: 'heading', text: 'Shock neurogénico' },
      { kind: 'paragraph', text: 'Puede ocurrir tras lesión medular alta, con vasodilatación e hipotensión, a menudo con bradicardia relativa. Debe diferenciarse de hemorragia asociada al trauma.' }
    ),
    anamnesis: reasoning(1, [
      ['Inicio y velocidad de deterioro', 'Preguntar cuándo comenzó el malestar, hipotensión, disnea, dolor, síncope, confusión o deterioro general y si la progresión fue súbita o gradual.', 'El inicio brusco favorece causas como hemorragia aguda, TEP, taponamiento, neumotórax, arritmia o anafilaxia.'],
      ['Hemorragia visible', 'Preguntar por hematemesis, melena, hematoquecia, hemoptisis, epistaxis, sangrado vaginal, heridas o sangrado postoperatorio.', 'Puede identificar shock hemorrágico y orientar inmediatamente al control del sangrado.'],
      ['Posible hemorragia oculta', 'Preguntar por trauma, dolor abdominal o lumbar, anticoagulación, cirugía reciente y procedimientos invasivos.', 'Hemorragias retroperitoneales, abdominales, torácicas o pélvicas pueden ser inicialmente ocultas.'],
      ['Dolor torácico', 'Caracterizar inicio, localización, irradiación, duración, relación con esfuerzo, respiración y síntomas asociados.', 'Puede orientar a síndrome coronario agudo, disección aórtica, TEP o neumotórax.'],
      ['Disnea', 'Preguntar por inicio, progresión, ortopnea, disnea paroxística nocturna, dolor pleurítico y hemoptisis.', 'Diferencia posibles causas cardiogénicas, obstructivas y respiratorias.'],
      ['Síntomas infecciosos', 'Preguntar por fiebre, escalofríos, tos, síntomas urinarios, dolor abdominal, lesiones cutáneas y otros focos.', 'Orienta a shock distributivo por sepsis.'],
      ['Exposición alérgica', 'Preguntar por medicamentos, alimentos, picaduras, contraste, látex u otros desencadenantes recientes.', 'La anafilaxia puede evolucionar rápidamente y requiere adrenalina inmediata.'],
      ['Síntomas cutáneos o mucosos agudos', 'Preguntar por urticaria, prurito, rubor, angioedema o sensación de cierre faríngeo.', 'Apoya anafilaxia, aunque su ausencia no la excluye.'],
      ['Síncope o presíncope', 'Preguntar por pérdida transitoria de conciencia, mareos, relación con esfuerzo y pródromos.', 'Puede indicar bajo gasto, arritmia, TEP, hemorragia o causa obstructiva.'],
      ['Palpitaciones', 'Preguntar por inicio súbito, ritmo percibido, duración y relación con deterioro.', 'Una arritmia puede ser la causa primaria del shock.'],
      ['Antecedentes cardiovasculares', 'Preguntar por infarto, insuficiencia cardíaca, valvulopatías, miocardiopatía, arritmias y procedimientos cardíacos.', 'Aumentan la probabilidad de shock cardiogénico y modifican tolerancia a fluidos.'],
      ['Riesgo tromboembólico', 'Preguntar por inmovilización, cirugía reciente, cáncer, trombosis previa, anticonceptivos, embarazo/puerperio y viajes prolongados.', 'Aumenta la sospecha de TEP de alto riesgo.'],
      ['Trauma reciente', 'Preguntar por mecanismo, impacto, altura, atropello, heridas penetrantes y evolución posterior.', 'Puede existir shock hemorrágico, obstructivo o neurogénico.'],
      ['Pérdidas gastrointestinales o renales', 'Preguntar por vómitos, diarrea, poliuria, fiebre prolongada y baja ingesta.', 'Orienta a hipovolemia no hemorrágica.'],
      ['Medicación habitual', 'Registrar antihipertensivos, diuréticos, beta bloqueantes, anticoagulantes, antiagregantes, corticoides y otros fármacos relevantes.', 'Puede modificar la respuesta hemodinámica, ocultar taquicardia o aumentar riesgo de sangrado.'],
      ['Uso crónico de corticoides o insuficiencia suprarrenal', 'Preguntar por terapia prolongada, suspensión reciente y diagnóstico previo.', 'Aumenta la sospecha de crisis suprarrenal.'],
      ['Embarazo y puerperio', 'Preguntar por embarazo posible, edad gestacional, sangrado, dolor abdominal, parto o cesárea reciente.', 'Obliga a considerar embarazo ectópico, hemorragia obstétrica, sepsis y TEP.'],
      ['Tóxicos e intoxicaciones', 'Preguntar por sobredosis, drogas recreativas, bloqueantes de canales de calcio, beta bloqueantes y otras sustancias.', 'Diversas intoxicaciones pueden producir vasodilatación, bradicardia, arritmias o depresión miocárdica.'],
      ['Estado basal y comorbilidades', 'Preguntar por enfermedad renal, hepática, pulmonar, fragilidad y nivel funcional habitual.', 'Modifica presentación, reserva fisiológica y estrategia de reanimación.'],
      ['Respuesta a intervenciones previas', 'Preguntar si recibió fluidos, transfusión, vasopresores, adrenalina, antibióticos, cardioversión u otras medidas y qué respuesta tuvo.', 'La respuesta terapéutica aporta información diagnóstica sobre el mecanismo predominante.']
    ]),
    physicalExam: reasoning(2, [
      ['Signos vitales y tendencia', 'Evaluar presión arterial, PAM, frecuencia cardíaca, frecuencia respiratoria, SpO2 y temperatura, considerando tendencia.', 'El shock es dinámico y una medición aislada puede subestimar deterioro.'],
      ['Estado mental', 'Evaluar conciencia, orientación, atención, agitación y somnolencia.', 'El deterioro neurológico puede reflejar hipoperfusión cerebral.'],
      ['Perfusión periférica', 'Evaluar relleno capilar, temperatura, color, moteado y sudoración.', 'Ayuda a reconocer hipoperfusión y respuesta a tratamiento.'],
      ['Pulsos', 'Comparar amplitud, simetría y calidad de pulsos centrales y periféricos.', 'Puede aportar datos sobre volumen sistólico, vasoconstricción y patología aórtica.'],
      ['Venas yugulares', 'Evaluar ingurgitación yugular y cambios respiratorios cuando sea posible.', 'Ingurgitación con shock favorece causas cardiogénicas u obstructivas; yugulares planas pueden apoyar hipovolemia, aunque ningún hallazgo aislado es definitivo.'],
      ['Auscultación pulmonar', 'Buscar crepitantes, disminución unilateral del murmullo, sibilancias y otros hallazgos.', 'Ayuda a diferenciar edema pulmonar, neumotórax, anafilaxia y causas respiratorias.'],
      ['Trabajo respiratorio y expansión torácica', 'Evaluar frecuencia, uso de músculos accesorios, simetría y fatiga.', 'Puede revelar insuficiencia respiratoria, neumotórax o TEP.'],
      ['Examen cardiovascular', 'Evaluar ritmo, soplos, ruidos cardíacos, galope y signos de congestión.', 'Puede orientar a infarto complicado, valvulopatía aguda o falla de bomba.'],
      ['Piel y mucosas', 'Buscar palidez, cianosis, urticaria, angioedema, rubor, petequias y signos de deshidratación.', 'Orienta a hemorragia, anafilaxia, sepsis o hipovolemia.'],
      ['Hemorragia externa', 'Inspeccionar heridas, drenajes, sitios de punción y sangrado activo.', 'Una fuente hemorrágica visible debe controlarse de inmediato.'],
      ['Examen abdominal', 'Buscar distensión, dolor, defensa, masas, pulsaciones y signos peritoneales.', 'Puede revelar hemorragia intraabdominal, aneurisma roto o sepsis abdominal.'],
      ['Pelvis y trauma dirigido', 'En trauma, evaluar lesiones evidentes y estabilidad pélvica según contexto y protocolos.', 'La pelvis puede ser fuente de hemorragia significativa.'],
      ['Extremidades', 'Buscar edema unilateral, signos de trombosis, lesiones traumáticas y perfusión distal.', 'Puede apoyar TEP, hemorragia periférica o compromiso vascular.'],
      ['Diuresis', 'Cuantificar o estimar diuresis reciente.', 'La oliguria es un marcador importante de hipoperfusión y respuesta a reanimación.'],
      ['POCUS hemodinámico contextual', 'Cuando exista disponibilidad y entrenamiento, integrar función ventricular, ventrículo derecho, pericardio, pulmón, congestión, vena cava y líquido libre.', 'Puede acelerar la identificación del mecanismo del shock y de causas reversibles.'],
      ['Búsqueda de signos específicos de causa', 'Integrar hallazgos de infección, anafilaxia, sangrado, falla cardíaca, TEP, taponamiento, neumotórax y lesión medular según contexto.', 'El tratamiento definitivo depende de identificar rápidamente el mecanismo y la causa.']
    ]),
    differentialDiagnosis: {
      lifeThreatening: differentials(3, [
        ['Shock hemorrágico', 'Pérdida sanguínea externa u oculta con reducción crítica del volumen circulante. Buscar trauma, sangrado digestivo, retroperitoneal, vascular y gineco-obstétrico. La hemoglobina inicial puede ser normal. Control de hemorragia y reanimación hemostática son prioritarios.'],
        ['Shock séptico', 'Vasoplejía, hipoperfusión y disfunción orgánica asociadas a infección. Puede coexistir con hipovolemia relativa y disfunción miocárdica. Requiere antimicrobianos oportunos, reanimación individualizada, norepinefrina y control del foco.'],
        ['Anafilaxia', 'Shock distributivo agudo tras exposición compatible, con posible compromiso cutáneo, respiratorio, gastrointestinal o cardiovascular. La ausencia de manifestaciones cutáneas no la excluye. Adrenalina IM inmediata es el tratamiento de primera línea.'],
        ['Shock cardiogénico por síndrome coronario agudo', 'Falla de bomba secundaria a isquemia/infarto, frecuentemente con congestión, bajo gasto o complicaciones mecánicas. Requiere ECG, reperfusión urgente cuando corresponda y soporte hemodinámico individualizado.'],
        ['Complicación mecánica aguda del infarto', 'Rotura de músculo papilar, comunicación interventricular o rotura de pared libre pueden causar deterioro abrupto. Sospechar ante nuevo soplo, edema pulmonar, shock o derrame pericárdico después de IAM.'],
        ['Arritmia inestable', 'Taquiarritmia o bradiarritmia que produce hipotensión, isquemia, edema pulmonar, alteración mental o shock. Requiere tratamiento eléctrico/farmacológico urgente según el ritmo.'],
        ['Tromboembolismo pulmonar de alto riesgo', 'Obstrucción pulmonar aguda con falla ventricular derecha y shock. Sospechar ante disnea/síncope bruscos, hipoxemia, factores trombóticos y signos de sobrecarga derecha. Puede requerir reperfusión urgente.'],
        ['Taponamiento cardíaco', 'Aumento de presión pericárdica que limita el llenado cardíaco. POCUS/ecocardiografía puede acelerar el diagnóstico. El shock con compromiso hemodinámico requiere drenaje urgente.'],
        ['Neumotórax a tensión', 'Aumento de presión intratorácica con deterioro respiratorio y obstructivo. Si el diagnóstico es clínicamente evidente en un paciente inestable, realizar descompresión inmediata sin esperar imagen.'],
        ['Aneurisma de aorta roto', 'Hemorragia retroperitoneal/intraabdominal potencialmente catastrófica. Dolor abdominal o lumbar, síncope e hipotensión en paciente de riesgo requieren cirugía vascular inmediata.'],
        ['Disección aórtica complicada', 'Puede producir taponamiento, insuficiencia aórtica aguda, isquemia coronaria, hemorragia o malperfusión. Requiere reconocimiento y manejo especializado urgente.'],
        ['Hemorragia obstétrica / embarazo ectópico roto', 'Causa tiempo-dependiente de shock hemorrágico. Reanimación y control obstétrico/quirúrgico del sangrado deben avanzar en paralelo.'],
        ['Crisis suprarrenal', 'Hipotensión potencialmente refractaria, a menudo acompañada de síntomas gastrointestinales, hiponatremia, hiperpotasemia o hipoglucemia. Ante alta sospecha, el tratamiento con glucocorticoides no debe demorarse.'],
        ['Shock neurogénico por lesión medular', 'Pérdida de tono simpático tras lesión medular, habitualmente con hipotensión y bradicardia relativa. En trauma siempre excluir primero hemorragia y otras causas de shock.']
      ]),
      common: differentials(4, [
        ['Hipovolemia no hemorrágica', 'Vómitos, diarrea, poliuria, fiebre, baja ingesta o tercer espacio pueden reducir volumen circulante efectivo.'],
        ['Sepsis sin shock establecido', 'La infección con disfunción orgánica puede evolucionar hacia shock; reconocer deterioro antes de hipotensión profunda.'],
        ['Insuficiencia cardíaca aguda descompensada', 'Puede producir bajo gasto, congestión e hipoperfusión, especialmente en cardiopatía avanzada.'],
        ['Infarto agudo de miocardio', 'Puede causar shock por disfunción ventricular, arritmia o complicación mecánica.'],
        ['Taquiarritmia', 'FA rápida, flutter, TSV o taquicardia ventricular pueden reducir llenado y gasto, especialmente en pacientes vulnerables.'],
        ['Bradiarritmia', 'Bloqueos AV y otras bradicardias graves pueden producir bajo gasto e hipotensión.'],
        ['Sobredosis o efecto farmacológico', 'Beta bloqueantes, calcioantagonistas, sedantes y otros fármacos pueden producir vasodilatación, bradicardia o depresión miocárdica.'],
        ['Deshidratación grave', 'Forma frecuente de hipovolemia, especialmente en extremos de edad o enfermedad gastrointestinal.'],
        ['Hemorragia digestiva', 'Puede ser manifiesta u oculta y producir shock antes de una caída importante de hemoglobina.'],
        ['Shock mixto', 'Más de un mecanismo puede coexistir; por ejemplo sepsis con cardiomiopatía, hemorragia con vasoplejía o falla cardíaca con hipovolemia.']
      ]),
      contextual: differentials(5, [
        ['Insuficiencia ventricular derecha aguda', 'Puede aparecer por TEP, infarto de VD, hipertensión pulmonar o ventilación mecánica. La estrategia de fluidos/vasopresores difiere de la falla izquierda.'],
        ['Miocarditis fulminante', 'Puede producir shock cardiogénico grave en pacientes previamente sanos.'],
        ['Takotsubo', 'Disfunción ventricular transitoria que puede simular síndrome coronario y causar shock.'],
        ['Valvulopatía aguda grave', 'Insuficiencia mitral/aórtica aguda o disfunción protésica pueden producir edema pulmonar y shock.'],
        ['Endocarditis con complicación hemodinámica', 'Puede generar insuficiencia valvular, absceso, sepsis y shock mixto.'],
        ['Pancreatitis grave', 'Puede generar vasodilatación, tercer espacio y falla orgánica, simulando o coexistiendo con sepsis.'],
        ['Obstrucción intestinal o pérdidas por tercer espacio', 'Puede producir hipovolemia importante y alteraciones electrolíticas.'],
        ['Quemaduras extensas', 'Pérdida de volumen intravascular y respuesta inflamatoria sistémica requieren reanimación específica.'],
        ['Golpe de calor', 'Puede causar vasodilatación, hipovolemia, coagulopatía y falla multiorgánica.'],
        ['Intoxicación por beta bloqueantes', 'Bradicardia, hipotensión y depresión miocárdica; requiere tratamiento toxicológico específico.'],
        ['Intoxicación por calcioantagonistas', 'Puede producir vasoplejía, bradicardia, hiperglucemia y shock profundo.'],
        ['Intoxicación por antidepresivos tricíclicos', 'Puede generar arritmias, hipotensión y ensanchamiento del QRS.'],
        ['Sobredosis de opioides/sedantes', 'Depresión respiratoria e hipoxia pueden acompañarse de hipotensión; tratar causa y soporte vital.'],
        ['Síndrome de shock tóxico', 'Shock distributivo por toxinas bacterianas con falla multiorgánica.'],
        ['Crisis tiroidea', 'Puede producir vasodilatación, taquiarritmia y falla cardíaca de alto gasto o bajo gasto.'],
        ['Mixedema grave', 'Puede presentarse con hipotermia, bradicardia, hipoventilación e hipotensión.'],
        ['Embolia de líquido amniótico', 'Emergencia obstétrica con colapso cardiovascular, hipoxemia y coagulopatía.'],
        ['Shock posoperatorio', 'Considerar hemorragia, vasoplejía, isquemia, TEP, taponamiento, sepsis, efecto farmacológico y otras complicaciones según procedimiento.']
      ])
    },
    complementaryStudies: studies([
      ['Lactato sérico', 'Ante shock sospechado o hipoperfusión.', 'Marcador de gravedad/metabolismo alterado y basal para tendencia.', 'Elevación apoya gravedad pero no define mecanismo ni equivale a hipovolemia. Repetir si está elevado e interpretar junto con perfusión, diuresis y evolución.'],
      ['Gasometría arterial o venosa', 'Shock, insuficiencia respiratoria, acidosis o alteración ventilatoria.', 'pH, CO2, bicarbonato y, si arterial, oxigenación.', 'Permite valorar acidosis y soporte respiratorio; no define por sí sola la etiología.'],
      ['Hemograma', 'Evaluación inicial.', 'Anemia, leucocitosis/leucopenia, plaquetas.', 'Hemoglobina inicial normal no excluye hemorragia aguda. Interpretar tendencias.'],
      ['Función renal y electrolitos', 'Prácticamente todo shock.', 'Lesión renal, potasio, sodio, bicarbonato y alteraciones asociadas.', 'Informa disfunción orgánica y condiciona fármacos/terapia.'],
      ['Hepatograma', 'Shock moderado-grave o sospecha de falla orgánica.', 'Lesión hepatocelular, colestasis y bilirrubina.', 'La hipoperfusión puede causar lesión hepática; integrar con etiología.'],
      ['Coagulograma y fibrinógeno', 'Hemorragia, trauma, sepsis grave, hepatopatía o transfusión masiva.', 'Coagulopatía y consumo.', 'Guiar corrección hemostática junto con clínica y, si disponible, pruebas viscoelásticas.'],
      ['ECG de 12 derivaciones', 'Todo shock sin causa obvia, especialmente dolor torácico, arritmia o sospecha cardiogénica.', 'Isquemia, infarto, arritmia, bloqueos y signos indirectos de sobrecarga derecha.', 'Puede identificar causas tratables inmediatamente.'],
      ['Troponina', 'Sospecha de síndrome coronario, miocarditis, TEP o lesión miocárdica.', 'Daño miocárdico.', 'Puede elevarse en múltiples estados de shock; no equivale automáticamente a IAM tipo 1.'],
      ['POCUS cardíaco', 'Shock indiferenciado, sospecha cardiogénica u obstructiva.', 'Función ventricular izquierda/derecha, derrame pericárdico, signos de taponamiento, volumen sistólico aproximado y otras pistas.', 'Integrar con clínica. Evitar diagnosticar “hipovolemia” o indicar fluidos por un único parámetro.'],
      ['POCUS pulmonar', 'Disnea/shock.', 'Edema intersticial, neumotórax, derrame y consolidaciones.', 'Puede diferenciar rápidamente patrones cardiogénicos, obstructivos y respiratorios.'],
      ['Evaluación ecográfica de respuesta a fluidos', 'Cuando existe duda sobre fluidos adicionales.', 'Cambios hemodinámicos con elevación pasiva de piernas, mini-bolo u otras maniobras dinámicas.', 'Preferir variables dinámicas sobre medidas estáticas aisladas.'],
      ['Ecografía abdominal / FAST según contexto', 'Trauma, dolor abdominal, embarazo o sospecha de líquido libre.', 'Líquido libre, aneurisma, embarazo y otras pistas.', 'Un estudio negativo no excluye todas las hemorragias ocultas.'],
      ['Radiografía de tórax', 'Sospecha de edema, neumonía, neumotórax no evidente, complicaciones de dispositivos o diagnóstico incierto.', 'Edema, infiltrados, derrame, neumotórax y otras alteraciones.', 'No retrasar descompresión de neumotórax a tensión clínicamente evidente.'],
      ['Ecocardiograma formal', 'Shock cardiogénico/obstructivo, valvulopatía, complicación mecánica, miocarditis o incertidumbre persistente.', 'Función biventricular, válvulas, pericardio y hemodinámica.', 'Es central cuando una causa estructural puede cambiar tratamiento urgente.'],
      ['Tomografía dirigida', 'Paciente suficientemente estable cuando se sospecha TEP, disección, hemorragia oculta, foco abdominal u otra causa anatómica.', 'Diagnóstico etiológico y planificación terapéutica.', 'No trasladar a un paciente críticamente inestable a TC si existe una causa tratable que puede diagnosticarse/actuarse al lado de la cama.'],
      ['Pruebas pretransfusionales / banco de sangre', 'Hemorragia significativa o posibilidad de transfusión.', 'Compatibilidad y preparación de componentes.', 'En hemorragia exanguinante activar protocolo local y no retrasar transfusión crítica esperando pruebas completas cuando el protocolo contemple sangre de emergencia.']
    ]),
    initialTreatment: richText(
      { kind: 'heading', text: 'Principio general' },
      { kind: 'paragraph', text: 'Tratar simultáneamente:' },
      { kind: 'bullet', items: ['oxigenación/ventilación', 'perfusión', 'mecanismo del shock', 'causa reversible'] },
      { kind: 'paragraph', text: 'No existe una única reanimación válida para todos los tipos de shock.' },
      { kind: 'heading', text: '1. Vía aérea y respiración' },
      { kind: 'paragraph', text: 'Administrar oxígeno ante hipoxemia y escalar soporte según necesidad.' },
      { kind: 'paragraph', text: 'Si requiere intubación, anticipar colapso peri-intubación:' },
      { kind: 'bullet', items: ['optimizar hemodinamia antes del procedimiento cuando sea posible', 'preparar vasopresores', 'elegir estrategia farmacológica apropiada', 'minimizar apnea e hipotensión', 'reconocer que presión positiva puede empeorar retorno venoso y falla del VD'] },
      { kind: 'paragraph', text: 'En neumotórax a tensión clínicamente evidente: descompresión inmediata.' },
      { kind: 'heading', text: '2. Acceso y monitorización' },
      { kind: 'paragraph', text: 'Obtener accesos vasculares adecuados.' },
      { kind: 'paragraph', text: 'Monitorizar ECG, presión arterial, SpO2, temperatura y diuresis.' },
      { kind: 'paragraph', text: 'Considerar línea arterial en shock persistente o con vasopresores, sin retrasar tratamiento.' },
      { kind: 'heading', text: '3. Fluidos: solo cuando corresponden' },
      { kind: 'paragraph', text: 'Utilizar cristaloides, preferentemente balanceados en la mayoría de escenarios que requieren expansión.' },
      { kind: 'paragraph', text: 'Dar bolos pequeños/moderados y reevaluar cuando el mecanismo no sea claramente hemorrágico y exista posibilidad de respuesta.' },
      { kind: 'paragraph', text: 'Utilizar medidas dinámicas cuando sea posible.' },
      { kind: 'paragraph', text: 'Evitar bolos repetidos indiscriminados en:' },
      { kind: 'bullet', items: ['shock cardiogénico', 'edema pulmonar', 'falla ventricular derecha', 'TEP de alto riesgo', 'taponamiento', 'pacientes que ya no responden a volumen'] },
      { kind: 'paragraph', text: 'En shock hemorrágico, priorizar sangre/componentes y control del sangrado sobre grandes volúmenes de cristaloides.' },
      { kind: 'heading', text: '4. Vasopresores' },
      { kind: 'paragraph', text: 'Norepinefrina es una opción de primera línea en la mayoría de los shocks vasodilatados y con hipotensión persistente.' },
      { kind: 'paragraph', text: 'Puede iniciarse por vía periférica proximal adecuada y vigilada si esperar una vía central retrasaría el tratamiento.' },
      { kind: 'paragraph', text: 'Objetivo inicial frecuente de PAM: alrededor de 65 mmHg, individualizado según mecanismo, perfusión y antecedentes.' },
      { kind: 'paragraph', text: 'No usar vasopresores como sustituto del control de una hemorragia o de una obstrucción mecánica.' },
      { kind: 'heading', text: '5. Inotrópicos' },
      { kind: 'paragraph', text: 'Considerar cuando existe bajo gasto por disfunción miocárdica con hipoperfusión persistente pese a una presión/perfusión de llenado razonablemente optimizadas.' },
      { kind: 'paragraph', text: 'Dobutamina puede utilizarse en escenarios seleccionados.' },
      { kind: 'paragraph', text: 'Epinefrina puede aportar soporte inotrópico y vasopresor según contexto.' },
      { kind: 'heading', text: '6. Shock hemorrágico' },
      { kind: 'paragraph', text: 'Prioridades:' },
      { kind: 'bullet', items: ['control inmediato del sangrado', 'activar protocolo de hemorragia masiva cuando corresponda', 'transfusión balanceada según protocolo local', 'calcio y temperatura', 'prevenir hipotermia, acidosis y coagulopatía', 'minimizar cristaloides excesivos'] },
      { kind: 'paragraph', text: 'En trauma hemorrágico sin traumatismo craneoencefálico grave, puede considerarse una estrategia de presión más baja/permisiva hasta control del sangrado según protocolos y contexto.' },
      { kind: 'paragraph', text: 'En TCE grave, evitar hipotensión y priorizar perfusión cerebral.' },
      { kind: 'paragraph', text: 'Ácido tranexámico: utilizar en indicaciones y ventanas temporales específicas, como trauma hemorrágico temprano o hemorragia posparto, siguiendo protocolos correspondientes; no administrarlo indiscriminadamente a todo shock.' },
      { kind: 'heading', text: '7. Shock distributivo séptico' },
      { kind: 'paragraph', text: 'Seguir abordaje de Sepsis:' },
      { kind: 'bullet', items: ['antimicrobianos oportunos', 'cultivos sin retrasar tratamiento', 'cristaloides individualizados', 'norepinefrina', 'control del foco', 'reevaluación seriada'] },
      { kind: 'heading', text: '8. Anafilaxia' },
      { kind: 'paragraph', text: 'Adrenalina IM inmediata en cara anterolateral del muslo.' },
      { kind: 'paragraph', text: 'Repetir según respuesta y protocolos.' },
      { kind: 'paragraph', text: 'Asegurar vía aérea/oxígeno, fluidos si existe hipotensión y tratamiento complementario.' },
      { kind: 'paragraph', text: 'Antihistamínicos y corticoides NO sustituyen adrenalina y no deben retrasarla.' },
      { kind: 'paragraph', text: 'En shock refractario puede requerirse infusión IV de adrenalina en ambiente monitorizado y manejo avanzado.' },
      { kind: 'heading', text: '9. Shock cardiogénico' },
      { kind: 'paragraph', text: 'Identificar causa y corregirla:' },
      { kind: 'bullet', items: ['reperfusión urgente en síndrome coronario cuando corresponda', 'tratar arritmias', 'identificar complicaciones mecánicas', 'evitar sobrecarga de volumen', 'usar vasopresores/inotrópicos según perfil hemodinámico', 'considerar soporte circulatorio mecánico solo en escenarios seleccionados y equipos especializados'] },
      { kind: 'paragraph', text: 'En hipotensión grave, norepinefrina suele preferirse como vasopresor sobre dopamina por perfil de seguridad.' },
      { kind: 'heading', text: '10. Shock por falla ventricular derecha / TEP' },
      { kind: 'paragraph', text: 'Evitar sobrecarga de volumen.' },
      { kind: 'paragraph', text: 'Optimizar oxigenación y reducir factores que aumentan resistencia vascular pulmonar.' },
      { kind: 'paragraph', text: 'Usar vasopresores para sostener perfusión sistémica cuando sea necesario.' },
      { kind: 'paragraph', text: 'En TEP de alto riesgo con shock, evaluar reperfusión urgente (trombólisis sistémica, estrategia dirigida por catéter o embolectomía según contraindicaciones, recursos y contexto).' },
      { kind: 'heading', text: '11. Taponamiento cardíaco' },
      { kind: 'paragraph', text: 'Mantener perfusión mientras se organiza drenaje urgente.' },
      { kind: 'paragraph', text: 'Evitar intervenciones que reduzcan bruscamente precarga si pueden diferirse.' },
      { kind: 'paragraph', text: 'El tratamiento definitivo es aliviar la presión pericárdica.' },
      { kind: 'heading', text: '12. Neumotórax a tensión' },
      { kind: 'paragraph', text: 'Descompresión inmediata seguida de drenaje torácico definitivo según protocolos.' },
      { kind: 'paragraph', text: 'No esperar radiografía en un paciente inestable con diagnóstico clínico claro.' },
      { kind: 'heading', text: '13. Arritmia inestable' },
      { kind: 'paragraph', text: 'Si una taquiarritmia causa inestabilidad: cardioversión sincronizada según ritmo/protocolo.' },
      { kind: 'paragraph', text: 'Si bradicardia causa inestabilidad: seguir algoritmo de bradicardia, incluyendo atropina cuando corresponda y escalamiento a estimulación/vasoactivos según respuesta.' },
      { kind: 'heading', text: '14. Crisis suprarrenal' },
      { kind: 'paragraph', text: 'Ante alta sospecha:' },
      { kind: 'bullet', items: ['glucocorticoide IV inmediato', 'fluidos', 'corrección de hipoglucemia/electrolitos', 'tratar precipitante'] },
      { kind: 'paragraph', text: 'No esperar confirmación bioquímica si el cuadro es crítico.' },
      { kind: 'heading', text: '15. Shock neurogénico' },
      { kind: 'paragraph', text: 'Después de excluir/controlar hemorragia:' },
      { kind: 'bullet', items: ['soporte hemodinámico', 'vasopresores con actividad alfa adecuada', 'manejo de bradicardia cuando sea clínicamente relevante', 'objetivos de perfusión según lesión medular/protocolo especializado'] }
    ),
    reassessment: richText(
      { kind: 'paragraph', text: 'Reevaluar después de cada intervención relevante:' },
      { kind: 'bullet', items: ['estado mental', 'PA/PAM', 'FC y ritmo', 'relleno capilar', 'temperatura/moteado', 'pulsos', 'diuresis', 'lactato seriado si estaba elevado', 'gasometría/acidosis', 'trabajo respiratorio', 'oxigenación', 'congestión pulmonar/sistémica', 'respuesta dinámica a fluidos', 'dosis/tendencia de vasopresores', 'signos de bajo gasto', 'POCUS seriado cuando aporte', 'hemorragia activa', 'hemoglobina y coagulación en contexto', 'función renal/hepática', 'causa del shock y control definitivo'] },
      { kind: 'paragraph', text: 'Preguntas:' },
      { kind: 'bullet', items: ['¿Mejoró la perfusión?', '¿Mejoró el estado mental?', '¿Mejoró el relleno capilar?', '¿La diuresis se recupera?', '¿La presión adecuada se acompaña de perfusión adecuada?', '¿El paciente responde a fluidos?', '¿Está acumulando volumen?', '¿Necesita iniciar/escalar vasopresor?', '¿Existe bajo gasto que requiera inotropía?', '¿El mecanismo inicial sigue siendo el correcto?', '¿Coexisten dos tipos de shock?', '¿Se controló la hemorragia?', '¿Se resolvió la obstrucción?', '¿Se trató la infección/anafilaxia/arritmia?', '¿Necesita procedimiento, UCI o traslado?'] },
      { kind: 'paragraph', text: 'No perseguir la normalización de un único número ignorando la perfusión global.' }
    ),
    disposition: {
      discharge: richText(
        { kind: 'paragraph', text: 'Un paciente con shock verdadero no es candidato a alta durante la fase aguda.' },
        { kind: 'paragraph', text: 'El alta solo puede considerarse si la evaluación demuestra que no existió shock o que el episodio transitorio tuvo una causa benigna completamente resuelta, sin hipoperfusión, sin disfunción orgánica, con signos vitales estables, diagnóstico seguro y seguimiento adecuado.' }
      ),
      admission: richText(
        { kind: 'paragraph', text: 'Indicar internación cuando exista:' },
        { kind: 'bullet', items: ['episodio de hipotensión/hipoperfusión clínicamente relevante', 'necesidad de fluidos IV significativos', 'anemia/sangrado que requiera vigilancia', 'infección con riesgo', 'arritmia tratada con riesgo de recurrencia', 'cardiopatía descompensada', 'necesidad de estudios o tratamiento hospitalario'] },
        { kind: 'paragraph', text: 'El nivel de internación depende de la estabilidad y tendencia.' }
      ),
      criticalCare: richText(
        { kind: 'paragraph', text: 'Indicar UCI/área crítica ante:' },
        { kind: 'bullet', items: ['shock persistente', 'vasopresores/inotrópicos', 'ventilación invasiva o soporte respiratorio avanzado', 'hemorragia activa grave', 'transfusión masiva', 'shock cardiogénico', 'TEP de alto riesgo', 'taponamiento', 'falla multiorgánica', 'arritmia inestable recurrente', 'deterioro rápido', 'necesidad de monitorización/intervención continua'] }
      ),
      referral: richText(
        { kind: 'paragraph', text: 'Según etiología:' },
        { kind: 'bullet', items: ['cirugía general/trauma', 'cirugía vascular', 'cardiología/hemodinamia', 'cirugía cardiovascular', 'cuidados intensivos', 'infectología', 'obstetricia', 'toxicología', 'neurocirugía/trauma raquimedular', 'neumonología/equipo de TEP', 'otros especialistas'] },
        { kind: 'paragraph', text: 'Derivar a centro de mayor complejidad cuando se necesite reperfusión, cirugía, soporte circulatorio, intervencionismo u otros recursos no disponibles.' },
        { kind: 'paragraph', text: 'No retrasar medidas salvadoras durante la organización del traslado.' }
      )
    },
    warningsAndInstructions: richText(
      { kind: 'paragraph', text: 'Si finalmente se descarta shock y el paciente puede manejarse ambulatoriamente, indicar retorno inmediato ante:' },
      { kind: 'bullet', items: ['síncope o presíncope', 'debilidad intensa', 'confusión', 'disnea', 'dolor torácico', 'palpitaciones persistentes', 'sangrado', 'hematemesis, melena o hematoquecia', 'dolor abdominal/lumbar intenso', 'fiebre con deterioro general', 'oliguria marcada', 'urticaria/angioedema o dificultad respiratoria', 'empeoramiento rápido', 'incapacidad para hidratarse', 'nuevos síntomas neurológicos'] }
    ),
    commonErrors: richText({ kind: 'bullet', items: ['Definir shock únicamente por hipotensión.', 'Esperar lactato para iniciar tratamiento de un shock clínicamente evidente.', 'Interpretar todo lactato elevado como hipovolemia.', 'Administrar fluidos indiscriminadamente a cualquier shock.', 'Usar una vena cava “colapsable” como única indicación de fluidos.', 'Continuar bolos pese a ausencia de respuesta y aparición de congestión.', 'Retrasar norepinefrina esperando una vía central.', 'Usar vasopresores para compensar una hemorragia sin controlar.', 'Dar grandes volúmenes de cristaloides en shock hemorrágico en lugar de reanimación hemostática.', 'No buscar hemorragia oculta.', 'No considerar shock mixto.', 'Omitir POCUS/ecocardiografía cuando puede cambiar rápidamente la hipótesis.', 'Retrasar descompresión de neumotórax a tensión por imagen.', 'Retrasar drenaje de taponamiento inestable.', 'Dar antihistamínicos antes que adrenalina en anafilaxia.', 'Sobrecargar de volumen a un paciente con falla ventricular derecha.', 'Tratar la presión arterial sin evaluar perfusión.', 'No reevaluar después de cada intervención.', 'No buscar una causa mecánica/reversible del shock.', 'Trasladar a TC a un paciente demasiado inestable cuando existe una alternativa diagnóstica/terapéutica inmediata al lado de la cama.'] }),
    clinicalPearls: richText({ kind: 'bullet', items: ['Shock es hipoperfusión; hipotensión es solo una de sus posibles manifestaciones.', 'Un paciente puede estar en shock con presión arterial inicialmente normal.', 'La tendencia clínica importa más que una medición aislada.', 'Relleno capilar, piel, estado mental y diuresis siguen siendo herramientas hemodinámicas valiosas.', 'Lactato elevado indica riesgo, no necesariamente hipovolemia.', 'Antes de dar fluidos preguntarse: ¿es probable que responda y tolerará el volumen?', 'Respuesta a fluidos y necesidad de fluidos no son sinónimos.', 'POCUS es una extensión del examen, no un diagnóstico automático.', 'Un único diámetro de vena cava no define volumen intravascular.', 'Norepinefrina puede iniciarse periféricamente de forma segura con acceso adecuado y vigilancia cuando esperar una central retrasaría tratamiento.', 'La PAM objetivo debe individualizarse; ~65 mmHg suele ser un punto inicial.', 'En hemorragia, controlar el sangrado es parte de la reanimación.', 'En shock hemorrágico grave, sangre y hemostasia importan más que litros de cristaloides.', 'En anafilaxia, la primera droga es adrenalina IM.', 'En neumotórax a tensión inestable, el tratamiento precede a la radiografía.', 'En taponamiento, el tratamiento definitivo es el drenaje.', 'En TEP de alto riesgo, el problema central es la falla aguda del ventrículo derecho.', 'Shock cardiogénico no significa “nunca dar fluidos”; significa individualizar y evitar sobrecarga.', 'Los mecanismos de shock pueden mezclarse y cambiar con el tiempo.', 'La mejor prueba de una intervención hemodinámica es la respuesta del paciente, reevaluada inmediatamente.'] })
  };
}

const shockDecisionTree: DecisionTree = {
  rootNodeId: 'shock-n01',
  nodes: [
    { id: 'shock-n01', type: 'start', title: 'Paciente con sospecha de shock o hipoperfusión', description: 'Reconocer hipoperfusión aunque la presión arterial esté inicialmente conservada y comenzar estabilización mientras se identifica el mecanismo.' },
    { id: 'shock-n02', type: 'action', title: 'ABCDE, monitorización y acceso vascular', description: 'Evaluar vía aérea, respiración, circulación, estado neurológico y exposición; monitorizar y obtener acceso vascular sin retrasar medidas salvadoras.' },
    { id: 'shock-n03', type: 'question', title: '¿Existe una causa inmediatamente reversible?', description: 'Buscar hemorragia masiva, anafilaxia, arritmia inestable, neumotórax a tensión, taponamiento, TEP de alto riesgo y otras causas tiempo-dependientes.' },
    { id: 'shock-n04', type: 'question', title: '¿Hay hemorragia activa o altamente probable?', description: 'Buscar sangrado externo, trauma, sangrado digestivo, retroperitoneal, vascular y gineco-obstétrico.' },
    { id: 'shock-n05', type: 'action', title: 'Control de hemorragia y reanimación hemostática', description: 'Controlar el sangrado, activar protocolo de hemorragia masiva cuando corresponda, utilizar sangre/componentes según protocolo y evitar cristaloides excesivos.' },
    { id: 'shock-n06', type: 'question', title: '¿Anafilaxia probable?', description: 'Considerar exposición compatible con compromiso cardiovascular, respiratorio, cutáneo o gastrointestinal. La ausencia de lesiones cutáneas no la excluye.' },
    { id: 'shock-n07', type: 'action', title: 'Adrenalina IM inmediata', description: 'Administrar adrenalina intramuscular en muslo, repetir según respuesta/protocolo y agregar soporte de vía aérea, oxígeno y fluidos si están indicados.' },
    { id: 'shock-n08', type: 'question', title: '¿Arritmia responsable de la inestabilidad?', description: 'Determinar si una taquiarritmia o bradiarritmia está causando hipotensión, isquemia, edema pulmonar, alteración mental o shock.' },
    { id: 'shock-n09', type: 'action', title: 'Tratar arritmia inestable', description: 'Cardioversión sincronizada en taquiarritmia inestable según ritmo/protocolo o algoritmo de bradicardia con escalamiento apropiado.' },
    { id: 'shock-n10', type: 'question', title: '¿Neumotórax a tensión clínicamente probable?', description: 'Shock con deterioro respiratorio y hallazgos compatibles debe tratarse inmediatamente si la sospecha clínica es alta.' },
    { id: 'shock-n11', type: 'action', title: 'Descompresión inmediata', description: 'Descomprimir sin esperar imagen cuando el diagnóstico clínico es evidente y completar posteriormente drenaje torácico definitivo.' },
    { id: 'shock-n12', type: 'question', title: '¿Taponamiento cardíaco?', description: 'Integrar shock, ingurgitación yugular, contexto y POCUS/ecocardiografía con derrame y compromiso hemodinámico.' },
    { id: 'shock-n13', type: 'action', title: 'Drenaje pericárdico urgente', description: 'Sostener perfusión mientras se organiza la descompresión definitiva y evitar retrasos innecesarios.' },
    { id: 'shock-n14', type: 'question', title: '¿TEP de alto riesgo con shock?', description: 'Buscar inicio brusco, hipoxemia, síncope, factores trombóticos y signos de falla aguda del ventrículo derecho.' },
    { id: 'shock-n15', type: 'action', title: 'Evaluar reperfusión urgente', description: 'Considerar trombólisis sistémica, intervención dirigida por catéter o embolectomía según contraindicaciones, recursos y contexto.' },
    { id: 'shock-n16', type: 'action', title: 'Definir perfil hemodinámico predominante', description: 'Integrar examen, perfusión, congestión, antecedentes, ECG, laboratorio y POCUS para clasificar el mecanismo predominante sin asumir que sea puro.' },
    { id: 'shock-n17', type: 'question', title: '¿Predomina hipovolemia?', description: 'Pérdidas, hemorragia ya controlada, deshidratación, baja precarga y ausencia de congestión pueden apoyar este mecanismo.' },
    { id: 'shock-n18', type: 'action', title: 'Expansión de volumen individualizada', description: 'Administrar cristaloides cuando corresponda; en hemorragia priorizar hemoderivados. Reevaluar inmediatamente la respuesta y tolerancia.' },
    { id: 'shock-n19', type: 'question', title: '¿Predomina vasodilatación distributiva?', description: 'Considerar sepsis, anafilaxia ya tratada, neurogénico, vasoplejía y causas endocrinas/toxicológicas.' },
    { id: 'shock-n20', type: 'action', title: 'Norepinefrina si persiste hipotensión', description: 'Usar norepinefrina como vasopresor inicial habitual en shock vasodilatado. Puede iniciarse por vía periférica adecuada y vigilada si esperar una central retrasaría el tratamiento.' },
    { id: 'shock-n21', type: 'question', title: '¿Sepsis o shock séptico probable?', description: 'Buscar infección, disfunción orgánica y foco; no usar qSOFA aislado para excluir sepsis.' },
    { id: 'shock-n22', type: 'action', title: 'Antimicrobianos y control del foco', description: 'Administrar antimicrobianos oportunos, obtener cultivos sin retrasarlos y coordinar control del foco cuando esté indicado.' },
    { id: 'shock-n23', type: 'question', title: '¿Predomina falla de bomba / cardiogénico?', description: 'Buscar congestión, bajo gasto, isquemia, disfunción ventricular, valvulopatía aguda o complicación mecánica.' },
    { id: 'shock-n24', type: 'action', title: 'Tratar causa cardíaca y sostener perfusión', description: 'Priorizar reperfusión cuando corresponda, tratar arritmias/complicaciones mecánicas, evitar sobrecarga y usar vasoactivos según perfil.' },
    { id: 'shock-n25', type: 'question', title: '¿Hay bajo gasto persistente por disfunción miocárdica?', description: 'Confirmar hipoperfusión con evidencia de falla de bomba pese a presión y precarga razonablemente optimizadas.' },
    { id: 'shock-n26', type: 'action', title: 'Considerar soporte inotrópico', description: 'Considerar dobutamina u otra estrategia inotrópica apropiada según perfil hemodinámico, presión arterial y contexto.' },
    { id: 'shock-n27', type: 'question', title: '¿Predomina mecanismo obstructivo no resuelto?', description: 'Reconsiderar TEP, taponamiento, neumotórax y otras obstrucciones al llenado o eyección si el diagnóstico inicial no fue evidente.' },
    { id: 'shock-n28', type: 'action', title: 'Resolver la obstrucción específica', description: 'El tratamiento definitivo es etiológico: reperfusión del TEP, drenaje del taponamiento o descompresión del neumotórax según causa.' },
    { id: 'shock-n29', type: 'question', title: '¿Es probable que responda a fluidos Y tolera volumen?', description: 'Usar evaluación dinámica y considerar congestión, función ventricular y mecanismo. Respuesta a fluidos no equivale por sí sola a indicación de administrarlos.' },
    { id: 'shock-n30', type: 'action', title: 'Bolo prudente y reevaluación inmediata', description: 'Si existe indicación, administrar un bolo individualizado y valorar cambio en perfusión/volumen sistólico y signos de congestión.' },
    { id: 'shock-n31', type: 'warning', title: 'Evitar fluidos indiscriminados', description: 'Si no responde, existe congestión o el mecanismo no se beneficia de volumen, suspender bolos repetidos y corregir el soporte según fisiopatología.' },
    { id: 'shock-n32', type: 'question', title: '¿Persiste hipoperfusión después del tratamiento inicial?', description: 'Reevaluar PAM, estado mental, relleno capilar, diuresis, lactato en contexto, congestión, POCUS y control de la causa.' },
    { id: 'shock-n33', type: 'action', title: 'Replantear mecanismo y buscar shock mixto', description: 'Si no mejora, reconsiderar diagnóstico, mecanismos coexistentes, hemorragia oculta, falla de bomba, vasoplejía u obstrucción no reconocida.' },
    { id: 'shock-n34', type: 'disposition', title: 'Definir nivel de cuidado y disposición', description: 'Shock persistente, vasopresores/inotrópicos, ventilación avanzada, hemorragia grave, cardiogénico u obstructivo requieren área crítica y tratamiento definitivo; derivar si faltan recursos.' }
  ],
  edges: [
    { id: 'shock-e01', from: 'shock-n01', to: 'shock-n02', label: 'Iniciar' },
    { id: 'shock-e02', from: 'shock-n02', to: 'shock-n03', label: 'Buscar causa reversible' },
    { id: 'shock-e03', from: 'shock-n03', to: 'shock-n04', label: 'Evaluar causas' },
    { id: 'shock-e04', from: 'shock-n04', to: 'shock-n05', label: 'Sí' },
    { id: 'shock-e05', from: 'shock-n04', to: 'shock-n06', label: 'No' },
    { id: 'shock-e06', from: 'shock-n05', to: 'shock-n16', label: 'Tras control inicial' },
    { id: 'shock-e07', from: 'shock-n06', to: 'shock-n07', label: 'Sí' },
    { id: 'shock-e08', from: 'shock-n06', to: 'shock-n08', label: 'No' },
    { id: 'shock-e09', from: 'shock-n07', to: 'shock-n16', label: 'Reevaluar' },
    { id: 'shock-e10', from: 'shock-n08', to: 'shock-n09', label: 'Sí' },
    { id: 'shock-e11', from: 'shock-n08', to: 'shock-n10', label: 'No' },
    { id: 'shock-e12', from: 'shock-n09', to: 'shock-n16', label: 'Reevaluar' },
    { id: 'shock-e13', from: 'shock-n10', to: 'shock-n11', label: 'Sí' },
    { id: 'shock-e14', from: 'shock-n10', to: 'shock-n12', label: 'No' },
    { id: 'shock-e15', from: 'shock-n11', to: 'shock-n16', label: 'Tras descompresión' },
    { id: 'shock-e16', from: 'shock-n12', to: 'shock-n13', label: 'Sí' },
    { id: 'shock-e17', from: 'shock-n12', to: 'shock-n14', label: 'No' },
    { id: 'shock-e18', from: 'shock-n13', to: 'shock-n16', label: 'Tras drenaje' },
    { id: 'shock-e19', from: 'shock-n14', to: 'shock-n15', label: 'Sí' },
    { id: 'shock-e20', from: 'shock-n14', to: 'shock-n16', label: 'No' },
    { id: 'shock-e21', from: 'shock-n15', to: 'shock-n16', label: 'Continuar soporte' },
    { id: 'shock-e22', from: 'shock-n16', to: 'shock-n17', label: 'Clasificar' },
    { id: 'shock-e23', from: 'shock-n17', to: 'shock-n18', label: 'Sí' },
    { id: 'shock-e24', from: 'shock-n17', to: 'shock-n19', label: 'No' },
    { id: 'shock-e25', from: 'shock-n18', to: 'shock-n29', label: 'Valorar respuesta' },
    { id: 'shock-e26', from: 'shock-n19', to: 'shock-n20', label: 'Sí' },
    { id: 'shock-e27', from: 'shock-n19', to: 'shock-n23', label: 'No' },
    { id: 'shock-e28', from: 'shock-n20', to: 'shock-n21', label: 'Buscar causa distributiva' },
    { id: 'shock-e29', from: 'shock-n21', to: 'shock-n22', label: 'Sí' },
    { id: 'shock-e30', from: 'shock-n21', to: 'shock-n29', label: 'No / otra causa' },
    { id: 'shock-e31', from: 'shock-n22', to: 'shock-n29', label: 'Reevaluar perfusión' },
    { id: 'shock-e32', from: 'shock-n23', to: 'shock-n24', label: 'Sí' },
    { id: 'shock-e33', from: 'shock-n23', to: 'shock-n27', label: 'No' },
    { id: 'shock-e34', from: 'shock-n24', to: 'shock-n25', label: 'Reevaluar bajo gasto' },
    { id: 'shock-e35', from: 'shock-n25', to: 'shock-n26', label: 'Sí' },
    { id: 'shock-e36', from: 'shock-n25', to: 'shock-n29', label: 'No' },
    { id: 'shock-e37', from: 'shock-n26', to: 'shock-n29', label: 'Reevaluar' },
    { id: 'shock-e38', from: 'shock-n27', to: 'shock-n28', label: 'Sí' },
    { id: 'shock-e39', from: 'shock-n27', to: 'shock-n29', label: 'No / mecanismo mixto' },
    { id: 'shock-e40', from: 'shock-n28', to: 'shock-n29', label: 'Tras tratamiento' },
    { id: 'shock-e41', from: 'shock-n29', to: 'shock-n30', label: 'Sí' },
    { id: 'shock-e42', from: 'shock-n29', to: 'shock-n31', label: 'No' },
    { id: 'shock-e43', from: 'shock-n30', to: 'shock-n32', label: 'Reevaluar' },
    { id: 'shock-e44', from: 'shock-n31', to: 'shock-n32', label: 'Cambiar estrategia' },
    { id: 'shock-e45', from: 'shock-n32', to: 'shock-n33', label: 'Reevaluar mecanismo y respuesta' },
    { id: 'shock-e46', from: 'shock-n33', to: 'shock-n34', label: 'Tras replanteo' }
  ]
};

export function createShockClinicalApproach(userId: string): ClinicalApproach {
  const timestamp = new Date().toISOString();
  const content: ClinicalApproachContent = {
    ...createShockApproachBaseContent(),
    decisionTree: shockDecisionTree,
    relatedContent: []
  };
  const validation = validateDecisionTree(content.decisionTree);
  if (validation.errors.length > 0 || validation.warnings.length > 0) {
    const issues = [...validation.errors, ...validation.warnings].map((issue) => issue.message).join(' ');
    throw new Error(`El fixture de Shock contiene un árbol inválido: ${issues}`);
  }
  return {
    id: crypto.randomUUID(),
    userId,
    title: SHOCK_APPROACH_TITLE,
    description: SHOCK_APPROACH_DESCRIPTION,
    categoryId: null,
    category: null,
    content,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'complete'
  };
}
