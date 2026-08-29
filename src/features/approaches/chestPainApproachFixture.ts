import type { TipTapDocument } from '../../types/topic';
import type { ClinicalApproach, ComplementaryStudy, DifferentialDiagnosisItem, ReasoningItem } from './clinicalApproachTypes';
import { validateDecisionTree } from './decisionTreeValidation';

type TextBlock = { kind: 'paragraph' | 'heading'; text: string } | { kind: 'bullet'; items: string[] };

const textNode = (text: string) => ({ type: 'text', text });
const richText = (...blocks: TextBlock[]): TipTapDocument => ({
  type: 'doc',
  content: blocks.map((block) => block.kind === 'bullet'
    ? { type: 'bulletList', content: block.items.map((item) => ({ type: 'listItem', content: [{ type: 'paragraph', content: [textNode(item)] }] })) }
    : { type: block.kind, ...(block.kind === 'heading' ? { attrs: { level: 3 } } : {}), content: [textNode(block.text)] })
});
const paragraph = (text: string): TipTapDocument => richText({ kind: 'paragraph', text });
const stableId = (group: number, index: number) => `${group.toString().padStart(8, '0')}-0000-4000-8000-${index.toString().padStart(12, '0')}`;

const reasoning = (group: number, entries: Array<[string, string, string]>): ReasoningItem[] => entries.map(([title, content, whyItMatters], index) => ({
  id: stableId(group, index + 1), title, content: paragraph(content), whyItMatters: paragraph(whyItMatters)
}));

const differentials = (group: number, entries: Array<[string, string]>): DifferentialDiagnosisItem[] => entries.map(([title, explanation], index) => ({
  id: stableId(group, index + 1), title, explanation: paragraph(explanation)
}));

const studies = (entries: Array<[string, string, string, string]>): ComplementaryStudy[] => entries.map(([name, whenToOrder, targetFinding, interpretation], index) => ({
  id: stableId(5, index + 1), name, whenToOrder: paragraph(whenToOrder), targetFinding: paragraph(targetFinding), interpretation: paragraph(interpretation)
}));

export const CHEST_PAIN_APPROACH_TITLE = 'Dolor torácico';

export function createChestPainClinicalApproach(userId: string): ClinicalApproach {
  const timestamp = new Date().toISOString();
  const approach: ClinicalApproach = {
    id: crypto.randomUUID(), userId, title: CHEST_PAIN_APPROACH_TITLE,
    description: 'Abordaje inicial del paciente con dolor torácico, orientado a evaluar estabilidad, identificar causas potencialmente mortales, estratificar riesgo y definir estudios, tratamiento y disposición.',
    categoryId: null, category: null, createdAt: timestamp, updatedAt: timestamp, status: 'complete',
    content: {
      version: 1,
      presentation: richText(
        { kind: 'paragraph', text: 'Dolor torácico es cualquier dolor, presión, opresión, pesadez, ardor o molestia localizada en el tórax o en regiones relacionadas que pueda corresponder a patología cardiovascular, pulmonar, digestiva, musculoesquelética u otras causas.' },
        { kind: 'paragraph', text: 'No debe limitarse al concepto de dolor precordial. Las molestias en hombros, brazos, cuello, mandíbula, espalda o epigastrio, así como disnea o fatiga, pueden representar equivalentes anginosos.' },
        { kind: 'paragraph', text: 'El objetivo inicial no es establecer inmediatamente una etiología definitiva, sino responder de forma ordenada:' },
        { kind: 'bullet', items: ['¿Está estable?', '¿Existe una causa potencialmente mortal?', '¿Hay evidencia de síndrome coronario agudo?', '¿Qué diagnóstico es más probable?', '¿Puede recibir el alta o necesita internación, cuidados críticos o derivación?'] }
      ),
      initialAssessment: richText(
        { kind: 'paragraph', text: 'Realizar una valoración inicial simultánea de:' },
        { kind: 'bullet', items: ['vía aérea', 'respiración', 'circulación', 'estado de conciencia', 'frecuencia cardíaca', 'presión arterial', 'frecuencia respiratoria', 'saturación de oxígeno', 'temperatura', 'perfusión periférica', 'trabajo respiratorio', 'signos de shock'] },
        { kind: 'paragraph', text: 'Considerar al paciente inestable ante:' },
        { kind: 'bullet', items: ['hipotensión o shock', 'alteración significativa del sensorio', 'hipoxemia importante', 'dificultad respiratoria grave', 'arritmia con compromiso hemodinámico', 'dolor persistente asociado a deterioro clínico', 'insuficiencia cardíaca aguda', 'paro o situación de pre-paro'] },
        { kind: 'paragraph', text: 'En un paciente inestable, la estabilización y la búsqueda de la causa potencialmente mortal deben ocurrir en paralelo.' }
      ),
      lifeThreats: richText(
        { kind: 'paragraph', text: 'Las principales causas potencialmente mortales que deben excluirse prioritariamente son:' },
        { kind: 'bullet', items: ['Síndrome coronario agudo', 'Síndrome aórtico agudo', 'Tromboembolismo pulmonar', 'Neumotórax a tensión', 'Taponamiento cardíaco', 'Rotura esofágica'] },
        { kind: 'heading', text: 'Síndrome coronario agudo' }, { kind: 'paragraph', text: 'Considerar ante dolor/opresión retroesternal, irradiación a brazos, mandíbula o espalda, relación con esfuerzo, síntomas vegetativos, disnea o factores de riesgo cardiovascular. Ninguna característica aislada excluye el diagnóstico.' },
        { kind: 'heading', text: 'Síndrome aórtico agudo' }, { kind: 'paragraph', text: 'Pensar ante inicio brusco, máxima intensidad desde el comienzo, dolor torácico o dorsal intenso, déficit neurológico, asimetría de pulsos o presión, insuficiencia aórtica nueva, síncope o antecedentes de aortopatía.' },
        { kind: 'heading', text: 'Tromboembolismo pulmonar' }, { kind: 'paragraph', text: 'Considerar ante disnea súbita, dolor pleurítico, taquicardia, hipoxemia, hemoptisis, síncope o signos de TVP, especialmente en presencia de factores predisponentes.' },
        { kind: 'heading', text: 'Neumotórax a tensión' }, { kind: 'paragraph', text: 'Dolor súbito, disnea, hipoxemia, hipotensión y marcada disminución unilateral de entrada de aire. En un paciente inestable con alta sospecha, el tratamiento no debe demorarse esperando imágenes.' },
        { kind: 'heading', text: 'Taponamiento cardíaco' }, { kind: 'paragraph', text: 'Considerar ante hipotensión, taquicardia, ingurgitación yugular, ruidos cardíacos apagados, pulso paradójico o contexto predisponente. POCUS puede ser muy útil.' },
        { kind: 'heading', text: 'Rotura esofágica' }, { kind: 'paragraph', text: 'Considerar ante dolor intenso posterior a vómitos repetidos, disfagia, enfisema subcutáneo, sepsis, derrame pleural o instrumentación esofágica reciente.' }
      ),
      anamnesis: reasoning(1, [
        ['Inicio de los síntomas', 'Preguntar cuándo comenzó el dolor, si el comienzo fue súbito o progresivo, y qué estaba haciendo el paciente en ese momento.', 'El dolor máximo desde el primer instante aumenta la preocupación por síndrome aórtico agudo, tromboembolismo pulmonar o neumotórax. La velocidad de instalación ayuda a jerarquizar el diagnóstico diferencial.'],
        ['Localización', 'Determinar si el dolor es retroesternal, precordial, lateral, dorsal, epigástrico u otra localización.', 'La localización orienta el diagnóstico, aunque por sí sola tiene capacidad limitada para excluir causas graves.'],
        ['Características', 'Preguntar si es opresivo, constrictivo, sensación de peso, quemante, punzante, pleurítico o desgarrador.', 'Las características modifican la probabilidad diagnóstica, pero ninguna descripción aislada permite descartar síndrome coronario agudo.'],
        ['Irradiación', 'Preguntar por irradiación a brazo izquierdo o ambos brazos, hombros, mandíbula, cuello, espalda o epigastrio.', 'Algunas irradiaciones aumentan la sospecha de etiología cardiovascular o aórtica.'],
        ['Duración y evolución', 'Definir duración de cada episodio, recurrencia, progresión y persistencia.', 'El patrón temporal permite diferenciar causas isquémicas, pleuríticas, musculoesqueléticas y otras etiologías.'],
        ['Desencadenantes', 'Preguntar por esfuerzo, estrés, inspiración, tos, movimientos, comidas, deglución y cambios de posición.', 'Los desencadenantes ayudan a orientar el origen cardiovascular, respiratorio, digestivo o musculoesquelético.'],
        ['Factores que alivian o empeoran', 'Preguntar por reposo, nitroglicerina, posición corporal, inspiración y palpación.', 'La respuesta a una intervención puede orientar, pero el alivio con nitroglicerina no confirma etiología coronaria.'],
        ['Síntomas asociados', 'Buscar disnea, diaforesis, náuseas, vómitos, síncope, presíncope, palpitaciones, déficit neurológico, fiebre, tos, hemoptisis y edema unilateral de miembro inferior.', 'Los síntomas acompañantes pueden revelar una amenaza vital o modificar significativamente el diagnóstico diferencial.'],
        ['Antecedentes cardiovasculares', 'Interrogar hipertensión, diabetes, dislipemia, tabaquismo, obesidad, enfermedad coronaria previa, IAM, angioplastia, cirugía de revascularización y enfermedad vascular.', 'Modifican la probabilidad pretest de enfermedad coronaria.'],
        ['Riesgo tromboembólico', 'Preguntar por TVP o TEP previo, cáncer, cirugía reciente, inmovilidad, viajes prolongados, embarazo, puerperio, estrógenos y trombofilia.', 'Estos antecedentes modifican sustancialmente la probabilidad pretest de tromboembolismo pulmonar.'],
        ['Riesgo aórtico', 'Preguntar por aneurisma conocido, válvula aórtica bicúspide, síndrome de Marfan, otras enfermedades del tejido conectivo, antecedentes familiares y cirugía o manipulación aórtica.', 'Aumentan la probabilidad de síndrome aórtico agudo.'],
        ['Sustancias', 'Preguntar cuando corresponda por cocaína, anfetaminas y otros simpaticomiméticos.', 'Pueden desencadenar isquemia, vasoespasmo, hipertensión grave y otros eventos cardiovasculares.']
      ]),
      physicalExam: reasoning(2, [
        ['Apariencia general', 'Evaluar palidez, diaforesis, agitación, dificultad respiratoria y deterioro general.', 'Puede revelar rápidamente compromiso sistémico o hemodinámico.'],
        ['Signos vitales', 'Evaluar presión arterial, frecuencia cardíaca, frecuencia respiratoria, saturación, temperatura y estado hemodinámico.', 'La presencia de hipotensión, hipoxemia, taquicardia, bradicardia o fiebre modifica inmediatamente la prioridad diagnóstica y terapéutica.'],
        ['Evaluación cardiovascular', 'Evaluar ritmo, soplos, nuevo soplo de insuficiencia aórtica, tercer ruido, roce pericárdico, ingurgitación yugular y signos congestivos.', 'Puede orientar hacia insuficiencia cardíaca, síndrome aórtico, pericarditis o taponamiento.'],
        ['Pulsos periféricos', 'Comparar pulsos radiales y femorales, así como presión arterial entre extremidades cuando corresponda.', 'Una asimetría significativa aumenta la sospecha de síndrome aórtico agudo.'],
        ['Examen respiratorio', 'Evaluar entrada de aire bilateral, crepitantes, sibilancias, hipoventilación unilateral y signos de derrame.', 'Puede orientar a neumotórax, edema pulmonar, neumonía u otras causas respiratorias.'],
        ['Pared torácica', 'Evaluar reproducibilidad del dolor mediante palpación y movimiento.', 'Orienta hacia etiología musculoesquelética, aunque no excluye completamente síndrome coronario agudo.'],
        ['Miembros inferiores', 'Buscar edema unilateral, dolor, aumento de diámetro y otros signos compatibles con TVP.', 'Incrementa la sospecha de tromboembolismo pulmonar.'],
        ['Evaluación neurológica', 'Buscar déficit focal, alteración de conciencia o compromiso medular.', 'Un déficit neurológico asociado a dolor torácico puede ser manifestación de síndrome aórtico agudo u otra emergencia vascular.'],
        ['Piel y tejidos blandos', 'Buscar lesiones de herpes zóster, signos traumáticos y enfisema subcutáneo.', 'Puede revelar diagnósticos alternativos o complicaciones como rotura esofágica.']
      ]),
      differentialDiagnosis: {
        lifeThreatening: differentials(3, [
          ['Síndrome coronario agudo', 'Incluye IAM con elevación del ST, IAM sin elevación del ST y cuadros isquémicos agudos. Debe descartarse prioritariamente.'],
          ['Síndrome aórtico agudo', 'Especialmente relevante ante dolor brusco de máxima intensidad desde el inicio, irradiación dorsal, déficit neurológico o asimetría de pulsos.'],
          ['Tromboembolismo pulmonar', 'Considerar ante disnea, dolor pleurítico, hipoxemia, taquicardia, síncope o factores de riesgo tromboembólico.'],
          ['Neumotórax a tensión', 'Emergencia obstructiva asociada a dolor, disnea, hipoxemia, hipotensión y disminución unilateral de entrada de aire.'],
          ['Taponamiento cardíaco', 'Considerar especialmente ante hipotensión, ingurgitación yugular, derrame pericárdico o contexto predisponente.'],
          ['Rotura esofágica', 'Pensar ante dolor grave posterior a vómitos repetidos, instrumentación, enfisema subcutáneo o sepsis.']
        ]),
        common: differentials(4, [
          ['Dolor musculoesquelético', 'Suele relacionarse con movimiento, postura o sobrecarga y puede reproducirse con la palpación.'],
          ['Costocondritis', 'Dolor localizado y reproducible sobre articulaciones costocondrales, tras excluir causas graves.'],
          ['Reflujo gastroesofágico', 'Puede producir ardor retroesternal relacionado con comidas o decúbito.'],
          ['Espasmo esofágico', 'Puede simular dolor coronario y asociarse con deglución o disfagia.'],
          ['Ansiedad o crisis de pánico', 'Considerar después de evaluar causas orgánicas relevantes; puede acompañarse de hiperventilación y síntomas autonómicos.'],
          ['Neumonía', 'Dolor pleurítico acompañado de fiebre, tos, hipoxemia o hallazgos focales respiratorios.'],
          ['Pleuritis', 'Dolor que aumenta con la inspiración o la tos, secundario a inflamación pleural de distintas causas.']
        ]),
        contextual: differentials(6, [
          ['Pericarditis', 'Dolor frecuentemente pleurítico y posicional, con posible roce o cambios electrocardiográficos característicos.'],
          ['Miocarditis', 'Considerar ante dolor, disnea, arritmias o lesión miocárdica en contexto infeccioso o inflamatorio.'],
          ['Neumotórax espontáneo no hipertensivo', 'Puede causar dolor súbito y disnea con disminución unilateral de la entrada de aire.'],
          ['Herpes zóster', 'Dolor neurítico localizado que puede preceder a la aparición de lesiones vesiculares.'],
          ['Patología biliar', 'Dolor epigástrico o en hipocondrio derecho que puede irradiarse al tórax o dorso.'],
          ['Pancreatitis', 'Dolor epigástrico intenso con irradiación dorsal, náuseas y contexto compatible.'],
          ['Úlcera péptica', 'Dolor epigástrico relacionado con comidas; considerar complicaciones si el cuadro es súbito o grave.'],
          ['Radiculopatía cervical', 'Dolor irradiado al tórax o miembro superior asociado con síntomas neurológicos o movimientos cervicales.'],
          ['Anemia grave con desbalance oferta-demanda', 'Puede provocar isquemia o dolor torácico por aporte insuficiente de oxígeno al miocardio.']
        ])
      },
      complementaryStudies: studies([
        ['ECG de 12 derivaciones', 'De forma precoz ante dolor torácico agudo con posible etiología cardiovascular.', 'Elevación o depresión del ST, inversión de ondas T, ondas Q, arritmias, bloqueos y otros signos de enfermedad cardíaca aguda.', 'Un ECG inicial normal no excluye síndrome coronario agudo. Si la sospecha persiste pueden necesitarse ECG seriados.'],
        ['Troponina cardíaca de alta sensibilidad', 'Ante sospecha de síndrome coronario agudo.', 'Evidencia de lesión miocárdica y cambios dinámicos compatibles con ascenso o descenso.', 'Una troponina elevada demuestra lesión miocárdica, pero no equivale automáticamente a IAM tipo 1. Debe interpretarse junto con clínica, ECG y evolución.'],
        ['Radiografía de tórax', 'Cuando el diagnóstico diferencial incluye patología pulmonar, pleural, aórtica o insuficiencia cardíaca.', 'Neumotórax, neumonía, edema pulmonar, derrame pleural y signos indirectos de enfermedad aórtica.', 'Una radiografía normal no excluye tromboembolismo pulmonar ni síndrome aórtico agudo.'],
        ['Ecografía clínica / POCUS', 'Especialmente útil ante inestabilidad o cuando se sospecha una causa cardiovascular o pulmonar potencialmente grave.', 'Función ventricular, alteraciones segmentarias, derrame pericárdico, signos de taponamiento, dilatación ventricular derecha, congestión pulmonar, neumotórax y hallazgos aórticos accesibles.', 'Permite una evaluación rápida junto a la cama, pero no reemplaza estudios definitivos cuando estos están indicados.'],
        ['D-dímero', 'En pacientes seleccionados con probabilidad pretest baja o intermedia de tromboembolismo pulmonar.', 'Un resultado que permita excluir TEP en el contexto clínico apropiado.', 'No debe pedirse indiscriminadamente ni utilizarse para descartar TEP en pacientes de alta probabilidad.'],
        ['Angio-TC pulmonar', 'Cuando la estrategia diagnóstica de TEP indica necesidad de imagen.', 'Defectos de llenado compatibles con tromboembolismo pulmonar y repercusión asociada.', 'Es uno de los principales estudios diagnósticos para TEP en pacientes apropiadamente seleccionados.'],
        ['Angio-TC de aorta', 'Ante sospecha relevante de síndrome aórtico agudo en un paciente suficientemente estable para traslado e imagen.', 'Disección, hematoma intramural, úlcera penetrante y complicaciones asociadas.', 'Permite confirmar y definir extensión anatómica de enfermedad aórtica aguda.'],
        ['Laboratorio complementario', 'Según presentación clínica y diagnóstico diferencial.', 'Hemograma, glucemia, función renal, ionograma, coagulación, hepatograma, gasometría, lactato, beta-hCG y otros estudios dirigidos.', 'Debe seleccionarse según contexto y no utilizarse como batería inespecífica obligatoria.']
      ]),
      decisionTree: {
        rootNodeId: 'chest-start',
        nodes: [
          { id: 'chest-start', type: 'start', title: 'Paciente con dolor torácico', description: 'Realizar evaluación inicial, signos vitales y búsqueda inmediata de inestabilidad y causas potencialmente mortales.' },
          { id: 'unstable-question', type: 'question', title: '¿El paciente está inestable?', description: 'Buscar shock, hipotensión, alteración del sensorio, hipoxemia grave, insuficiencia respiratoria, arritmia inestable o deterioro clínico.' },
          { id: 'unstable-action', type: 'warning', title: 'Estabilización inmediata', description: 'ABC, monitorización, accesos y tratamiento de soporte mientras se identifica y trata en paralelo la causa potencialmente mortal.' },
          { id: 'lethal-question', type: 'question', title: '¿Hay datos que orienten a una amenaza vital específica?', description: 'Considerar síndrome coronario agudo, síndrome aórtico agudo, tromboembolismo pulmonar, neumotórax a tensión, taponamiento cardíaco y rotura esofágica.' },
          { id: 'tension-ptx', type: 'warning', title: 'Sospecha de neumotórax a tensión', description: 'En paciente inestable con fuerte sospecha clínica, realizar tratamiento urgente sin esperar confirmación radiológica.' },
          { id: 'tamponade', type: 'warning', title: 'Sospecha de taponamiento cardíaco', description: 'Evaluación urgente, POCUS si disponible, soporte hemodinámico y resolución del derrame con compromiso hemodinámico.' },
          { id: 'aortic', type: 'warning', title: 'Sospecha de síndrome aórtico agudo', description: 'Priorizar control hemodinámico, analgesia, imagen definitiva cuando la estabilidad lo permita e interconsulta cardiovascular urgente.' },
          { id: 'pe', type: 'warning', title: 'Sospecha de tromboembolismo pulmonar de alto riesgo', description: 'Evaluar compromiso hemodinámico y necesidad de estrategia urgente de reperfusión según riesgo y contexto.' },
          { id: 'acs-initial', type: 'action', title: 'Evaluación inmediata de posible síndrome coronario agudo', description: 'Realizar ECG y utilizar troponina cardíaca de alta sensibilidad y una vía estructurada de evaluación de riesgo.' },
          { id: 'ecg-stemi', type: 'question', title: '¿Existe elevación persistente del ST o un patrón de oclusión coronaria aguda que requiera reperfusión urgente?', description: 'Interpretar el ECG junto con clínica y evolución. Repetir ECG cuando persista sospecha con trazado inicial no diagnóstico.' },
          { id: 'reperfusion', type: 'warning', title: 'Activar estrategia urgente de reperfusión', description: 'Manejar como síndrome coronario agudo con indicación de reperfusión según disponibilidad, tiempos y protocolo institucional.' },
          { id: 'acs-risk', type: 'action', title: 'Estratificar posible SCA sin indicación inmediata de reperfusión', description: 'Integrar clínica, ECG, troponinas seriadas y vía diagnóstica validada.' },
          { id: 'other-lethal', type: 'question', title: '¿Persiste sospecha de otra causa potencialmente mortal?', description: 'La ausencia de evidencia inicial de SCA no excluye TEP, síndrome aórtico, neumotórax, taponamiento o rotura esofágica.' },
          { id: 'directed-testing', type: 'action', title: 'Realizar estudios dirigidos según probabilidad pretest', description: 'Seleccionar radiografía, POCUS, D-dímero, angio-TC pulmonar, angio-TC aórtica u otros estudios según la hipótesis clínica.' },
          { id: 'lethal-confirmed', type: 'question', title: '¿Se confirmó o continúa siendo altamente probable una causa grave?', description: 'Integrar clínica, evolución y estudios complementarios.' },
          { id: 'specific-treatment', type: 'warning', title: 'Tratamiento específico y evaluación especializada', description: 'Iniciar el tratamiento correspondiente y determinar necesidad de intervención urgente, internación o cuidados críticos.' },
          { id: 'nonlethal-evaluation', type: 'action', title: 'Evaluar causas no inmediatamente letales', description: 'Considerar causas musculoesqueléticas, gastrointestinales, respiratorias, pericárdicas y otras según anamnesis y examen.' },
          { id: 'low-risk-question', type: 'question', title: '¿El paciente es clínicamente estable y de bajo riesgo tras la evaluación?', description: 'Requiere haber excluido razonablemente amenazas vitales y contar con una evaluación acorde con la sospecha clínica.' },
          { id: 'observe-admit', type: 'disposition', title: 'Observación o internación', description: 'Continuar evaluación, estudios seriados o tratamiento hospitalario según riesgo y diagnóstico probable.' },
          { id: 'critical-care', type: 'disposition', title: 'Cuidados críticos / intervención urgente', description: 'Indicado ante compromiso hemodinámico o respiratorio, causa vital confirmada o alto riesgo de deterioro.' },
          { id: 'discharge', type: 'disposition', title: 'Alta con seguimiento y pautas de alarma', description: 'Considerar en paciente estable, de bajo riesgo, con amenazas vitales razonablemente excluidas, síntomas controlados y seguimiento adecuado.' }
        ],
        edges: [
          { id: 'e01', from: 'chest-start', to: 'unstable-question' }, { id: 'e02', from: 'unstable-question', to: 'unstable-action', label: 'Sí' }, { id: 'e03', from: 'unstable-question', to: 'lethal-question', label: 'No' },
          { id: 'e04', from: 'unstable-action', to: 'lethal-question', label: 'Buscar causa mientras se estabiliza' }, { id: 'e05', from: 'lethal-question', to: 'tension-ptx', label: 'Neumotórax a tensión' },
          { id: 'e06', from: 'lethal-question', to: 'tamponade', label: 'Taponamiento' }, { id: 'e07', from: 'lethal-question', to: 'aortic', label: 'Síndrome aórtico' }, { id: 'e08', from: 'lethal-question', to: 'pe', label: 'TEP de alto riesgo' },
          { id: 'e09', from: 'lethal-question', to: 'acs-initial', label: 'Posible SCA' }, { id: 'e10', from: 'lethal-question', to: 'acs-initial', label: 'Sin orientación clara' },
          { id: 'e11', from: 'tension-ptx', to: 'critical-care' }, { id: 'e12', from: 'tamponade', to: 'critical-care' }, { id: 'e13', from: 'aortic', to: 'specific-treatment' }, { id: 'e14', from: 'pe', to: 'specific-treatment' },
          { id: 'e15', from: 'specific-treatment', to: 'critical-care', label: 'Inestable / alto riesgo' }, { id: 'e16', from: 'specific-treatment', to: 'observe-admit', label: 'Estable pero requiere internación' },
          { id: 'e17', from: 'acs-initial', to: 'ecg-stemi' }, { id: 'e18', from: 'ecg-stemi', to: 'reperfusion', label: 'Sí' }, { id: 'e19', from: 'ecg-stemi', to: 'acs-risk', label: 'No' },
          { id: 'e20', from: 'reperfusion', to: 'critical-care' }, { id: 'e21', from: 'acs-risk', to: 'other-lethal' }, { id: 'e22', from: 'other-lethal', to: 'directed-testing', label: 'Sí' },
          { id: 'e23', from: 'other-lethal', to: 'nonlethal-evaluation', label: 'No' }, { id: 'e24', from: 'directed-testing', to: 'lethal-confirmed' }, { id: 'e25', from: 'lethal-confirmed', to: 'specific-treatment', label: 'Sí' },
          { id: 'e26', from: 'lethal-confirmed', to: 'nonlethal-evaluation', label: 'No' }, { id: 'e27', from: 'nonlethal-evaluation', to: 'low-risk-question' }, { id: 'e28', from: 'low-risk-question', to: 'discharge', label: 'Sí' },
          { id: 'e29', from: 'low-risk-question', to: 'observe-admit', label: 'No' }
        ]
      },
      initialTreatment: richText(
        { kind: 'paragraph', text: 'No existe un tratamiento universal para el dolor torácico. La conducta depende de la causa.' },
        { kind: 'heading', text: 'Medidas generales' }, { kind: 'bullet', items: ['monitorización cuando exista riesgo cardiovascular o inestabilidad', 'acceso venoso según contexto', 'analgesia adecuada', 'tratamiento de hipoxemia si está presente'] },
        { kind: 'paragraph', text: 'No administrar oxígeno rutinariamente a pacientes normoxémicos únicamente por presentar dolor torácico.' },
        { kind: 'heading', text: 'Síndrome coronario agudo' }, { kind: 'paragraph', text: 'Tratamiento según subtipo, incluyendo antiagregación, anticoagulación, nitratos cuando corresponda, estatinas, estrategia invasiva o reperfusión según indicación.' },
        { kind: 'heading', text: 'Síndrome aórtico agudo' }, { kind: 'paragraph', text: 'Analgesia, reducción del estrés parietal, control de frecuencia y presión arterial, y evaluación cardiovascular urgente.' },
        { kind: 'heading', text: 'Tromboembolismo pulmonar' }, { kind: 'paragraph', text: 'Tratamiento según estabilidad hemodinámica y estratificación de riesgo.' },
        { kind: 'heading', text: 'Neumotórax a tensión' }, { kind: 'paragraph', text: 'Descompresión urgente.' },
        { kind: 'heading', text: 'Taponamiento cardíaco' }, { kind: 'paragraph', text: 'Soporte hemodinámico y drenaje urgente cuando exista compromiso significativo.' }
      ),
      reassessment: richText(
        { kind: 'paragraph', text: 'Reevaluar de forma seriada:' },
        { kind: 'bullet', items: ['intensidad y características del dolor', 'presión arterial', 'frecuencia cardíaca', 'frecuencia respiratoria', 'saturación', 'perfusión', 'estado neurológico', 'ECG', 'troponinas cuando corresponda', 'aparición de nuevos signos o síntomas'] },
        { kind: 'paragraph', text: 'La evolución clínica puede modificar la categoría de riesgo incluso cuando los estudios iniciales sean negativos.' }
      ),
      disposition: {
        discharge: richText({ kind: 'paragraph', text: 'Considerar alta cuando:' }, { kind: 'bullet', items: ['el paciente está estable', 'las amenazas vitales han sido razonablemente excluidas', 'el riesgo cardiovascular es bajo según una estrategia estructurada', 'los estudios necesarios resultan tranquilizadores', 'los síntomas están controlados', 'existe seguimiento adecuado', 'el paciente comprende las pautas de alarma'] }),
        admission: richText({ kind: 'paragraph', text: 'Considerar internación ante:' }, { kind: 'bullet', items: ['síndrome coronario agudo confirmado o probable', 'riesgo intermedio o alto', 'necesidad de estudios seriados', 'síntomas persistentes', 'arritmias relevantes', 'insuficiencia cardíaca', 'causas extracoronarias que requieran tratamiento hospitalario'] }),
        criticalCare: richText({ kind: 'paragraph', text: 'Indicar evaluación para cuidados críticos ante:' }, { kind: 'bullet', items: ['shock', 'insuficiencia respiratoria', 'arritmias graves', 'síndrome coronario agudo complicado', 'TEP de alto riesgo', 'síndrome aórtico complicado', 'taponamiento', 'neumotórax a tensión', 'deterioro hemodinámico significativo'] }),
        referral: richText({ kind: 'paragraph', text: 'Según la causa y complejidad pueden requerirse:' }, { kind: 'bullet', items: ['Cardiología', 'Hemodinamia', 'Cirugía cardiovascular', 'Cirugía torácica', 'Cirugía vascular', 'Neumonología', 'Gastroenterología', 'Centro de mayor complejidad'] })
      },
      warningsAndInstructions: richText({ kind: 'paragraph', text: 'En pacientes dados de alta, indicar nueva evaluación urgente ante:' }, { kind: 'bullet', items: ['dolor torácico recurrente o progresivo', 'disnea', 'síncope', 'sudoración intensa', 'palpitaciones persistentes', 'déficit neurológico', 'hemoptisis', 'deterioro general'] }),
      commonErrors: richText({ kind: 'bullet', items: ['Interpretar “dolor atípico” como ausencia de riesgo coronario.', 'Descartar síndrome coronario agudo por un único ECG normal.', 'Interpretar una troponina aislada sin contexto ni evolución.', 'Considerar toda troponina elevada como IAM tipo 1.', 'Utilizar D-dímero sin estimar probabilidad pretest.', 'Retrasar tratamiento de neumotórax a tensión esperando una radiografía.', 'Olvidar síndrome aórtico ante dolor asociado a déficit neurológico o asimetría de pulsos.', 'Considerar el alivio con nitroglicerina como prueba diagnóstica de etiología coronaria.', 'Solicitar estudios indiscriminadamente en pacientes correctamente clasificados como bajo riesgo.', 'Centrarse exclusivamente en síndrome coronario agudo y olvidar otras amenazas vitales.'] }),
      clinicalPearls: richText({ kind: 'bullet', items: ['Dolor torácico no significa solamente dolor retroesternal.', 'Un ECG normal no elimina la posibilidad de síndrome coronario agudo.', 'Una troponina positiva indica lesión miocárdica, no necesariamente IAM tipo 1.', 'El abordaje inicial comienza preguntando qué diagnóstico no se puede perder.', 'En pacientes inestables, diagnóstico y tratamiento ocurren simultáneamente.', 'La reevaluación forma parte del proceso diagnóstico.', 'La probabilidad diagnóstica cambia con la evolución clínica.'] }),
      relatedContent: []
    }
  };
  const validation = validateDecisionTree(approach.content.decisionTree);
  if (validation.errors.length > 0) throw new Error(`El fixture de Dolor torácico contiene un árbol inválido: ${validation.errors.map((issue) => issue.message).join(' ')}`);
  return approach;
}
