import type { TipTapDocument } from '../../types/topic';
import type { ClinicalApproach, ClinicalApproachContent, ComplementaryStudy, DecisionTree, DifferentialDiagnosisItem, ReasoningItem } from './clinicalApproachTypes';
import { validateDecisionTree } from './decisionTreeValidation';

type TextBlock = { kind: 'paragraph' | 'heading'; text: string } | { kind: 'bullet'; items: string[] };
type SepsisApproachBaseContent = Pick<ClinicalApproachContent,
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
const stableId = (group: number, index: number) => `5e95${group.toString().padStart(4, '0')}-0000-4000-8000-${index.toString().padStart(12, '0')}`;
const reasoning = (group: number, entries: Array<[string, string, string]>): ReasoningItem[] => entries.map(([title, content, whyItMatters], index) => ({
  id: stableId(group, index + 1), title, content: paragraph(content), whyItMatters: paragraph(whyItMatters)
}));
const differentials = (group: number, entries: Array<[string, string]>): DifferentialDiagnosisItem[] => entries.map(([title, explanation], index) => ({
  id: stableId(group, index + 1), title, explanation: paragraph(explanation)
}));
const studies = (entries: Array<[string, string, string, string]>): ComplementaryStudy[] => entries.map(([name, whenToOrder, targetFinding, interpretation], index) => ({
  id: stableId(6, index + 1), name, whenToOrder: paragraph(whenToOrder), targetFinding: paragraph(targetFinding), interpretation: paragraph(interpretation)
}));

export const SEPSIS_APPROACH_TITLE = 'Sepsis';
export const SEPSIS_APPROACH_DESCRIPTION = 'Abordaje del paciente con infección sospechada o confirmada y posible disfunción orgánica, orientado al reconocimiento precoz de sepsis y shock séptico, estabilización inicial, identificación y control del foco, tratamiento antimicrobiano oportuno, soporte hemodinámico individualizado y reevaluación seriada.';

export function createSepsisApproachBaseContent(): SepsisApproachBaseContent {
  return {
    version: 1,
    presentation: richText(
      { kind: 'paragraph', text: 'La sepsis es una disfunción orgánica potencialmente mortal causada por una respuesta desregulada del huésped frente a una infección. No debe entenderse simplemente como “infección grave” ni definirse por fiebre, leucocitosis o hipotensión aisladas.' },
      { kind: 'paragraph', text: 'El abordaje comienza ante un paciente con infección sospechada o confirmada que presenta deterioro clínico, signos de hipoperfusión o alteración aguda de uno o más órganos. Puede ser evidente, con shock, insuficiencia respiratoria o alteración marcada del sensorio, pero también inicialmente sutil. La ausencia de fiebre, leucocitosis o hipotensión no excluye sepsis.' },
      { kind: 'paragraph', text: 'Preguntas iniciales:' },
      { kind: 'bullet', items: ['¿Existe una infección probable?', '¿Hay disfunción orgánica aguda atribuible a esa infección?', '¿Existe shock o hipoperfusión?', '¿Qué órgano está comprometido?', '¿Cuál es el foco probable?', '¿Se necesitan cultivos u otras muestras?', '¿Cuándo deben iniciarse antimicrobianos?', '¿Necesita fluidos y cómo responderá?', '¿Necesita vasopresores?', '¿Existe un foco que requiera drenaje, cirugía, retirada de dispositivo u otro control invasivo?', '¿La evolución confirma la hipótesis o exige reconsiderar diagnósticos alternativos?'] },
      { kind: 'paragraph', text: 'SOFA puede utilizarse para objetivar disfunción orgánica en el contexto apropiado. qSOFA no debe utilizarse como herramienta aislada de screening ni para descartar sepsis.' },
      { kind: 'paragraph', text: 'La sepsis es dinámica: la evaluación debe repetirse después de cada intervención relevante.' }
    ),
    initialAssessment: richText(
      { kind: 'paragraph', text: 'Realizar evaluación simultánea de ABCDE, perfusión, disfunción orgánica y foco probable.' },
      { kind: 'heading', text: 'A — Vía aérea' },
      { kind: 'paragraph', text: 'Evaluar permeabilidad y capacidad para proteger la vía aérea. Considerar intervención avanzada ante deterioro del sensorio, agotamiento, incapacidad para protegerla o insuficiencia respiratoria progresiva.' },
      { kind: 'heading', text: 'B — Respiración' },
      { kind: 'paragraph', text: 'Evaluar frecuencia respiratoria, SpO2, trabajo respiratorio, auscultación, signos de foco pulmonar y necesidad de oxígeno o soporte ventilatorio. La taquipnea puede ser manifestación temprana de sepsis, hipoxemia o acidosis.' },
      { kind: 'heading', text: 'C — Circulación' },
      { kind: 'paragraph', text: 'Evaluar presión arterial, frecuencia y ritmo, pulsos, relleno capilar, temperatura/color de extremidades, diuresis, congestión y respuesta a intervenciones. La hipoperfusión puede existir con presión arterial inicialmente conservada.' },
      { kind: 'heading', text: 'D — Neurológico' },
      { kind: 'paragraph', text: 'Evaluar conciencia, orientación, atención, delirium, focalidad, convulsiones y glucemia cuando corresponda. El cambio agudo del estado mental puede constituir disfunción orgánica.' },
      { kind: 'heading', text: 'E — Exposición y foco' },
      { kind: 'paragraph', text: 'Examinar tórax, abdomen, región lumbar, piel/partes blandas, heridas, dispositivos, articulaciones, cavidad oral/cuello, SNC y contexto obstétrico cuando corresponda.' },
      { kind: 'paragraph', text: 'Buscar datos de disfunción orgánica: alteración mental, hipotensión, hipoperfusión, oliguria/lesión renal aguda, hipoxemia/insuficiencia respiratoria, trombocitopenia/coagulopatía, disfunción hepática, lactato elevado en contexto compatible, acidosis u otra falla orgánica.' },
      { kind: 'paragraph', text: 'Ante hipotensión o hipoperfusión: acceso vascular, monitorización, valorar fluidoterapia y necesidad temprana de vasopresores, lactato cuando corresponda, cultivos/muestras sin retrasar tratamiento urgente, antimicrobianos indicados y búsqueda activa de control del foco.' },
      { kind: 'paragraph', text: 'La respuesta a fluidos debe evaluarse dinámicamente. No asumir que todo paciente séptico necesita volúmenes crecientes de cristaloides. Evitar tanto hipoperfusión persistente como sobrecarga.' }
    ),
    lifeThreats: richText(
      { kind: 'paragraph', text: 'Prioridades:' },
      { kind: 'bullet', items: ['shock séptico', 'insuficiencia respiratoria aguda', 'meningitis/encefalitis', 'infección necrotizante de piel y partes blandas', 'infección intraabdominal con perforación, peritonitis o absceso', 'colangitis obstructiva', 'urosepsis obstructiva', 'neumonía grave', 'infección meningocócica invasiva', 'endocarditis complicada', 'infección asociada a dispositivo intravascular', 'neutropenia febril con sepsis', 'sepsis obstétrica', 'síndrome de shock tóxico', 'falla multiorgánica'] },
      { kind: 'heading', text: 'Shock séptico' },
      { kind: 'paragraph', text: 'Reconocer precozmente alteraciones circulatorias/metabólicas persistentes. En Sepsis-3 se identifica clínicamente por necesidad de vasopresores para mantener PAM adecuada y lactato persistentemente elevado pese a reanimación de volumen apropiada, sin hipovolemia como explicación suficiente. No esperar a cumplir formalmente todos los criterios para tratar un shock clínicamente evidente.' },
      { kind: 'heading', text: 'Insuficiencia respiratoria' },
      { kind: 'paragraph', text: 'Puede resultar del foco pulmonar, SDRA u otras complicaciones. Hipoxemia, aumento del trabajo, agotamiento o deterioro mental requieren escalamiento rápido.' },
      { kind: 'heading', text: 'Infección del SNC' },
      { kind: 'paragraph', text: 'Meningitis/encefalitis pueden evolucionar rápidamente. Neuroimagen o punción lumbar no deben retrasar antimicrobianos si existe alta sospecha bacteriana y los procedimientos demorarán el tratamiento.' },
      { kind: 'heading', text: 'Infección necrotizante' },
      { kind: 'paragraph', text: 'Dolor desproporcionado, progresión rápida, bullas, necrosis, crepitación, anestesia cutánea o toxicidad sistémica requieren evaluación quirúrgica urgente.' },
      { kind: 'heading', text: 'Foco abdominal/hepatobiliar complicado' },
      { kind: 'paragraph', text: 'Perforación, peritonitis, absceso y colangitis obstructiva pueden requerir cirugía, drenaje o intervención endoscópica además de antimicrobianos.' },
      { kind: 'heading', text: 'Urosepsis obstructiva' },
      { kind: 'paragraph', text: 'Puede no resolverse con antibióticos aislados y requiere descompresión urgente.' },
      { kind: 'heading', text: 'Neutropenia febril con sepsis' },
      { kind: 'paragraph', text: 'Los signos inflamatorios pueden ser mínimos; deterioro sistémico exige antimicrobianos tempranos y manejo de alto riesgo.' },
      { kind: 'heading', text: 'Sepsis obstétrica' },
      { kind: 'paragraph', text: 'Considerar focos uterino, herida, urinario, mamario y otros. No retrasar evaluación y tratamiento materno.' },
      { kind: 'heading', text: 'Falla multiorgánica' },
      { kind: 'paragraph', text: 'Compromiso progresivo respiratorio, circulatorio, renal, neurológico, hepático o hematológico implica alta gravedad y soporte avanzado.' }
    ),
    anamnesis: reasoning(1, [
      ['Inicio y evolución del deterioro', 'Cuándo comenzaron los síntomas infecciosos y cuándo apareció deterioro general, debilidad, confusión, disnea, hipotensión u otros signos de gravedad.', 'La velocidad de progresión ayuda a reconocer cuadros tiempo-dependientes y gravedad.'],
      ['Fiebre, escalofríos o hipotermia', 'Fiebre documentada, escalofríos, rigores o temperaturas bajas.', 'Sepsis puede presentarse con fiebre, normotermia o hipotermia.'],
      ['Síntomas respiratorios', 'Tos, expectoración, disnea, dolor pleurítico, hemoptisis y síntomas respiratorios recientes.', 'El foco respiratorio es frecuente y puede coexistir con insuficiencia respiratoria.'],
      ['Síntomas urinarios', 'Disuria, polaquiuria, urgencia, dolor lumbar, hematuria, retención y antecedentes de litiasis/obstrucción.', 'Identifica foco urinario y situaciones obstructivas que requieren control urgente.'],
      ['Síntomas abdominales', 'Dolor, vómitos, diarrea, distensión, constipación y cambios en deposiciones.', 'Puede orientar a infección intraabdominal, perforación o absceso.'],
      ['Síntomas hepatobiliares', 'Dolor en hipocondrio derecho, ictericia, coluria y antecedentes de litiasis/instrumentación biliar.', 'La colangitis obstructiva puede requerir descompresión urgente.'],
      ['Síntomas neurológicos', 'Cefalea, rigidez cervical, fotofobia, confusión, somnolencia, convulsiones o focalidad.', 'Puede indicar meningitis, encefalitis u otra infección del SNC.'],
      ['Piel y partes blandas', 'Heridas, eritema, edema, dolor, secreción, úlceras, lesiones progresivas o procedimientos.', 'Permite reconocer celulitis, abscesos e infección necrotizante.'],
      ['Dolor desproporcionado o progresión rápida', 'Dolor mayor al esperado por los hallazgos visibles y progresión rápida de lesiones.', 'Señal de alarma para infección necrotizante.'],
      ['Síntomas osteoarticulares', 'Dolor articular, limitación funcional, dolor óseo o vertebral focal.', 'Puede orientar a artritis séptica, osteomielitis o espondilodiscitis.'],
      ['Dispositivos y accesos', 'Catéter venoso, sonda urinaria, prótesis, marcapasos, material ortopédico, ostomías y otros dispositivos.', 'Pueden ser foco de bacteriemia y requerir intervención.'],
      ['Cirugía, procedimientos u hospitalización reciente', 'Operaciones, procedimientos invasivos, internaciones y alta reciente.', 'Modifica focos, microorganismos y riesgo de resistencia.'],
      ['Antimicrobianos recientes', 'Antibióticos utilizados, indicación, duración, adherencia y respuesta.', 'Modifica microbiología, susceptibilidad, cultivos y tratamiento empírico.'],
      ['Inmunosupresión', 'Cáncer, trasplante, VIH, corticoides, inmunomoduladores, asplenia u otras causas.', 'Aumenta riesgo de infecciones graves, atípicas y oportunistas.'],
      ['Neutropenia o quimioterapia reciente', 'Quimioterapia, enfermedades hematológicas y antecedentes de neutropenia.', 'Puede haber infección grave con pocos signos inflamatorios.'],
      ['Comorbilidades y reserva fisiológica', 'Insuficiencia cardíaca, renal, hepática, enfermedad pulmonar, diabetes y fragilidad.', 'Modifican tolerancia a fluidos, farmacocinética, falla orgánica y pronóstico.'],
      ['Embarazo y puerperio', 'Embarazo, edad gestacional, parto/cesárea reciente, pérdida gestacional, procedimientos y síntomas obstétricos.', 'Modifica focos, estudios, tratamiento y necesidad de evaluación obstétrica.'],
      ['Epidemiología y exposiciones', 'Viajes, animales, vectores, alimentos, agua, contactos, exposición ocupacional y brotes.', 'Puede orientar a microorganismos o síndromes específicos.'],
      ['Medicación habitual y alergias', 'Medicamentos, inmunosupresores, anticoagulantes y alergias antimicrobianas.', 'Influye en diagnóstico, toxicidad, selección y dosificación terapéutica.'],
      ['Estado funcional y mental basal', 'Movilidad, autonomía, cognición y estado mental habitual.', 'Permite reconocer delirium o deterioro funcional agudo como manifestación de sepsis.']
    ]),
    physicalExam: reasoning(2, [
      ['Signos vitales y tendencia', 'PA, FC, FR, SpO2 y temperatura considerando evolución.', 'Las tendencias pueden revelar deterioro antes del shock manifiesto.'],
      ['Estado general', 'Aspecto tóxico, debilidad, diaforesis, interacción y velocidad de deterioro.', 'La impresión clínica global no debe reemplazarse por una única escala.'],
      ['Estado mental', 'Conciencia, orientación, atención y delirium.', 'El cambio agudo puede representar disfunción orgánica.'],
      ['Perfusión periférica', 'Relleno capilar, temperatura, coloración, moteado y pulsos.', 'Detecta alteraciones circulatorias incluso antes de hipotensión marcada.'],
      ['Diuresis', 'Cuantificar o estimar diuresis reciente.', 'Oliguria puede indicar hipoperfusión o lesión renal aguda.'],
      ['Trabajo respiratorio', 'Frecuencia, músculos accesorios, habla, fatiga y patrón.', 'Reconoce insuficiencia respiratoria y necesidad de soporte.'],
      ['Auscultación pulmonar', 'Crepitantes, disminución del murmullo, consolidación, derrame u otros hallazgos.', 'Ayuda a identificar foco pulmonar y complicaciones.'],
      ['Examen cardiovascular', 'Frecuencia, ritmo, ruidos, soplos, congestión y perfusión.', 'Puede aportar datos de endocarditis, función cardiovascular y tolerancia a fluidos.'],
      ['Examen abdominal', 'Dolor, defensa, rigidez, peritonismo, distensión, masas e ictericia.', 'Puede identificar foco que requiera control urgente.'],
      ['Región lumbar y aparato urinario', 'Dolor costovertebral, globo vesical y signos de foco u obstrucción.', 'La urosepsis obstructiva requiere descompresión precoz.'],
      ['Piel y partes blandas', 'Eritema, edema, heridas, úlceras, bullas, necrosis, crepitación, secreciones y dolor.', 'Detecta focos cutáneos e infección necrotizante.'],
      ['Heridas, catéteres y dispositivos', 'Inspeccionar accesos, sondas, ostomías, prótesis expuestas y heridas quirúrgicas.', 'Pueden ser el foco y requerir retirada, drenaje u otra intervención.'],
      ['Examen neurológico y meníngeo', 'Focalidad, rigidez cervical, signos meníngeos y convulsiones según contexto.', 'Reconoce infección del SNC y otras causas de deterioro neurológico.'],
      ['Articulaciones y columna', 'Articulaciones calientes/tumefactas/dolorosas y dolor vertebral focal.', 'Puede orientar a artritis séptica, osteomielitis o espondilodiscitis.'],
      ['Petequias, púrpura y exantemas', 'Lesiones petequiales, purpúricas u otros exantemas relevantes.', 'Puede sugerir infección invasiva, coagulopatía u otros síndromes graves.'],
      ['Evaluación obstétrica contextual', 'En embarazo/puerperio evaluar dolor uterino, secreciones, sangrado, heridas y hallazgos pertinentes.', 'Reconoce focos obstétricos y orienta tratamiento materno específico.']
    ]),
    differentialDiagnosis: {
      lifeThreatening: differentials(3, [
        ['Shock séptico', 'Sepsis con alteración circulatoria/metabólica grave y necesidad de vasopresores para mantener una presión arterial adecuada pese a reanimación inicial apropiada. Buscar hipoperfusión, lactato elevado en contexto compatible, oliguria, alteración mental y falla orgánica progresiva. No esperar a completar criterios formales si el paciente presenta shock clínico.'],
        ['Meningitis o encefalitis bacteriana', 'Fiebre, alteración del sensorio, cefalea, rigidez cervical, convulsiones o focalidad deben hacer sospechar infección del sistema nervioso central. La neuroimagen o la punción lumbar no deben retrasar antimicrobianos cuando la sospecha bacteriana es alta y dichos procedimientos demorarían el tratamiento.'],
        ['Neumonía grave con insuficiencia respiratoria', 'Puede presentarse con hipoxemia, trabajo respiratorio aumentado, shock o SDRA. Requiere soporte respiratorio escalonado, antimicrobianos oportunos y búsqueda de complicaciones como derrame complicado o empiema.'],
        ['Infección necrotizante de piel y partes blandas', 'Dolor desproporcionado, rápida progresión, bullas, necrosis, crepitación o toxicidad sistémica son señales de alarma. El tratamiento definitivo requiere valoración quirúrgica urgente y control precoz del foco además de antimicrobianos.'],
        ['Perforación o peritonitis secundaria', 'Dolor abdominal, defensa, rigidez o inestabilidad pueden corresponder a un foco intraabdominal que necesita cirugía o drenaje. Los antibióticos aislados no sustituyen el control del foco.'],
        ['Colangitis obstructiva', 'Sepsis con dolor en hipocondrio derecho, ictericia o datos de obstrucción biliar. Puede requerir descompresión endoscópica o quirúrgica urgente.'],
        ['Urosepsis obstructiva', 'Pielonefritis o infección urinaria asociada a obstrucción por litiasis, tumor u otra causa. Requiere descompresión del sistema urinario además de antimicrobianos.'],
        ['Endocarditis infecciosa complicada', 'Considerar ante bacteriemia persistente, soplo nuevo, embolias, dispositivos intracardíacos, fenómenos vasculares o inmunológicos. Puede producir insuficiencia valvular, absceso, embolias y shock.'],
        ['Infección meningocócica invasiva', 'Fiebre, púrpura o petequias, shock y deterioro rápido obligan a tratamiento inmediato. La ausencia inicial de exantema no excluye enfermedad invasiva.'],
        ['Neutropenia febril con sepsis', 'El paciente neutropénico puede tener pocos signos inflamatorios locales. La inestabilidad o disfunción orgánica exige antimicrobianos empíricos de amplio espectro y manejo de alto riesgo.'],
        ['Sepsis obstétrica', 'Puede originarse en endometritis, infección de herida, infección urinaria, mastitis complicada u otros focos durante embarazo y puerperio. Requiere estabilización materna inmediata y control específico del foco.'],
        ['Síndrome de shock tóxico', 'Cuadro de shock con fiebre, exantema y falla multiorgánica asociado a toxinas bacterianas. Requiere antimicrobianos adecuados, control del foco y soporte intensivo.']
      ]),
      common: differentials(4, [
        ['Neumonía adquirida en la comunidad', 'Foco respiratorio frecuente de sepsis. Integrar síntomas, examen, imágenes y gravedad para decidir espectro antimicrobiano y nivel de cuidado.'],
        ['Pielonefritis', 'Fiebre, síntomas urinarios y dolor lumbar sugieren foco urinario alto. Buscar obstrucción, embarazo, instrumentación o bacteriemia que modifiquen conducta.'],
        ['Infección intraabdominal', 'Incluye colecistitis, diverticulitis, apendicitis, abscesos y otras infecciones abdominales. Debe definirse si requiere control invasivo del foco.'],
        ['Celulitis o absceso', 'La piel y tejidos blandos son focos frecuentes. La presencia de colección obliga a considerar drenaje; toxicidad marcada o dolor desproporcionado obligan a excluir infección necrotizante.'],
        ['Infección asociada a catéter', 'Considerar ante fiebre o bacteriemia sin otro foco, especialmente con accesos intravasculares. Puede requerir hemocultivos apropiados y retirada del dispositivo.'],
        ['Colangitis', 'Infección biliar que puede progresar rápidamente a sepsis. La obstrucción persistente requiere descompresión.'],
        ['Colecistitis complicada', 'Puede generar sepsis, especialmente en pacientes frágiles o con perforación, gangrena o absceso.'],
        ['Infección de herida quirúrgica', 'Evaluar profundidad, colecciones y material protésico. El tratamiento puede requerir apertura, drenaje, desbridamiento o retirada de material.'],
        ['Prostatitis bacteriana aguda', 'Puede producir bacteriemia y sepsis. Evitar masaje prostático en cuadros agudos y valorar retención u obstrucción.'],
        ['Bacteriemia sin foco evidente inicial', 'La ausencia de foco claro al ingreso no excluye sepsis. Repetir examen, revisar dispositivos, resultados microbiológicos e imágenes según evolución.']
      ]),
      contextual: differentials(5, [
        ['Endocarditis infecciosa', 'Especialmente ante válvula protésica, dispositivos, uso de drogas intravenosas, bacteriemia persistente o embolias.'],
        ['Artritis séptica', 'Articulación dolorosa, caliente y limitada, con o sin fiebre. Requiere diagnóstico microbiológico y drenaje según articulación/contexto.'],
        ['Osteomielitis o espondilodiscitis', 'Considerar ante dolor óseo o vertebral focal, bacteriemia o factores de riesgo.'],
        ['Empiema', 'Derrame pleural infectado asociado a neumonía. Puede requerir drenaje además de antimicrobianos.'],
        ['Absceso profundo', 'Colecciones hepáticas, esplénicas, pélvicas, retroperitoneales u otras pueden requerir drenaje percutáneo o quirúrgico.'],
        ['Infección de prótesis o material implantado', 'Puede producir infección persistente y requerir cirugía o retirada del material.'],
        ['Infección por Clostridioides difficile grave', 'Diarrea, dolor abdominal, leucocitosis o falla orgánica tras exposición sanitaria o antibióticos. Considerar megacolon tóxico y necesidad quirúrgica.'],
        ['Sepsis en paciente inmunocomprometido', 'Amplía el espectro de patógenos y puede disminuir signos inflamatorios habituales.'],
        ['Infección fúngica invasiva', 'No requiere cobertura empírica universal. Considerarla según inmunosupresión, hospitalización prolongada, antibióticos de amplio espectro, cirugía abdominal y otros factores.'],
        ['Infección viral grave', 'Influenza, SARS-CoV-2 y otros virus pueden producir disfunción orgánica y también coexistir con infección bacteriana.'],
        ['Tuberculosis diseminada', 'Puede simular sepsis, especialmente en inmunocomprometidos y cuadros subagudos.'],
        ['Malaria grave', 'Considerar según epidemiología y viajes; puede generar shock, acidosis, anemia, insuficiencia renal y alteración neurológica.'],
        ['Dengue grave u otras infecciones transmitidas por vectores', 'La epidemiología puede cambiar el diagnóstico. Shock, hemorragia, trombocitopenia y fuga capilar requieren enfoque específico.'],
        ['Leptospirosis grave', 'Considerar con exposición epidemiológica compatible, ictericia, insuficiencia renal o hemorragia pulmonar.'],
        ['Infección asociada a dispositivos cardíacos', 'Marcapasos y desfibriladores pueden ser focos persistentes con bacteriemia o endocarditis.'],
        ['Sepsis puerperal o posaborto', 'Puede progresar rápidamente y requerir antibióticos de amplio espectro y control uterino/quirúrgico del foco.'],
        ['Infección odontógena o cervical profunda', 'Puede amenazar la vía aérea y extenderse a espacios profundos del cuello o mediastino.'],
        ['Diagnóstico no infeccioso que simula sepsis', 'Pancreatitis, tromboembolismo pulmonar, crisis suprarrenal, anafilaxia, hemorragia, intoxicaciones, enfermedades autoinmunes y otras causas pueden producir SIRS, shock o disfunción orgánica. Revaluar siempre la probabilidad de infección.']
      ])
    },
    complementaryStudies: studies([
      ['Lactato sérico', 'Ante sepsis posible/probable con deterioro, hipoperfusión o shock; especialmente al inicio de la reanimación.', 'Evidencia indirecta de alteración metabólica/hipoperfusión y una referencia basal para seguimiento.', 'Un lactato elevado aumenta la preocupación por gravedad, pero no es específico de hipoxia tisular. Interpretarlo en contexto. Si está elevado, usar mediciones seriadas junto con otros marcadores de perfusión; no administrar fluidos indefinidamente hasta normalizarlo.'],
      ['Hemocultivos', 'En sepsis posible, probable o definida y shock séptico, idealmente antes de antimicrobianos si ello no retrasa el tratamiento.', 'Documentar bacteriemia/fungemia e identificar microorganismo y sensibilidad.', 'Tomar muestras apropiadas antes del antibiótico cuando sea factible. Un cultivo negativo no excluye infección.'],
      ['Cultivos y muestras del foco', 'Cuando exista un sitio sospechoso accesible: orina, LCR, secreciones respiratorias, heridas, abscesos, líquido pleural, peritoneal u otros.', 'Identificación microbiológica dirigida al foco.', 'La calidad de la muestra importa. Obtenerla antes del antimicrobiano cuando sea posible sin demorar tratamiento urgente o control del foco.'],
      ['Hemograma con plaquetas', 'En la evaluación inicial y seguimiento según gravedad.', 'Leucocitosis/leucopenia, anemia, trombocitopenia.', 'Ningún patrón aislado confirma o descarta sepsis. La trombocitopenia puede reflejar disfunción hematológica, CID u otras causas.'],
      ['Función renal y electrolitos', 'Prácticamente en todo paciente con sepsis sospechada con posible disfunción sistémica.', 'Creatinina, urea, sodio, potasio, bicarbonato y alteraciones relacionadas con lesión renal o tratamiento.', 'Comparar con basal si existe. Ajustar antimicrobianos y otros fármacos a función renal.'],
      ['Hepatograma y bilirrubina', 'Ante sepsis moderada-grave, ictericia, sospecha hepatobiliar o falla multiorgánica.', 'Colestasis, citólisis, hiperbilirrubinemia y disfunción hepática.', 'Puede reflejar foco hepatobiliar o disfunción orgánica secundaria.'],
      ['Coagulograma', 'En pacientes graves, sangrado, trombocitopenia, sospecha de CID, hepatopatía o necesidad de procedimiento.', 'Alteraciones de TP/INR, TTPa, fibrinógeno y otros marcadores disponibles.', 'Integrar con plaquetas, fibrinógeno y contexto clínico para valorar coagulopatía.'],
      ['Gasometría arterial o venosa según contexto', 'Ante insuficiencia respiratoria, shock, acidosis, alteración ventilatoria o necesidad de definir trastornos ácido-base.', 'pH, CO2, bicarbonato y, con gas arterial, oxigenación; lactato si se procesa.', 'La gasometría arterial es preferible cuando se requiere valoración precisa de oxigenación. Integrar con clínica.'],
      ['Glucemia', 'Durante evaluación inicial y seguimiento en pacientes graves.', 'Hipoglucemia o hiperglucemia.', 'Alteraciones pueden acompañar sepsis o contribuir a deterioro neurológico. En pacientes críticos, evitar control excesivamente intensivo.'],
      ['Radiografía de tórax', 'Ante síntomas respiratorios, hipoxemia o foco no claro cuando el tórax sea una posibilidad.', 'Infiltrados, consolidación, derrame, edema u otras alteraciones.', 'Una radiografía normal temprana no excluye neumonía. Considerar ecografía o TC según contexto.'],
      ['Ecografía clínica / POCUS', 'Como herramienta de apoyo en shock, disnea, evaluación de congestión, foco abdominal y procedimientos, según entrenamiento/disponibilidad.', 'Datos que ayuden a integrar función cardíaca, congestión, derrames, colecciones, hidronefrosis u otros hallazgos.', 'No usar un único parámetro ecográfico de forma aislada para decidir fluidos. Integrar con pruebas dinámicas y clínica.'],
      ['Ecografía renal/urinaria', 'Ante sospecha de infección urinaria complicada, obstrucción, litiasis, oliguria inexplicada o hidronefrosis.', 'Obstrucción, hidronefrosis, retención u otras complicaciones.', 'Obstrucción infectada es una urgencia de control del foco.'],
      ['Ecografía hepatobiliar', 'Ante ictericia, dolor en hipocondrio derecho, colestasis o sospecha de colecistitis/colangitis.', 'Dilatación biliar, litiasis, engrosamiento vesicular y signos indirectos de obstrucción.', 'Si persiste alta sospecha, puede requerirse TC, colangiorresonancia o intervención endoscópica.'],
      ['Tomografía computada dirigida al foco', 'Cuando el foco no esté claro o se sospechen abscesos, perforación, infección profunda, complicaciones pulmonares/abdominales u otros diagnósticos que cambien conducta.', 'Fuente anatómica de infección y lesiones que requieran control del foco.', 'No retrasar una intervención urgente obvia en un paciente inestable solo para completar imágenes.'],
      ['Procalcitonina', 'No utilizarla de rutina para decidir si iniciar antimicrobianos en sepsis sospechada.', 'Puede aportar información complementaria en contextos seleccionados.', 'No reemplaza evaluación clínica. Puede tener utilidad junto con la clínica para apoyar discontinuación de antimicrobianos cuando la duración óptima es incierta y existe adecuado control del foco.'],
      ['ECG y troponina según contexto', 'Ante dolor torácico, arritmia, shock, cardiopatía, disfunción miocárdica sospechada o necesidad de diferenciar causas concomitantes.', 'Arritmias, isquemia y evidencia de lesión miocárdica.', 'La elevación de troponina puede ocurrir en sepsis sin síndrome coronario agudo. Interpretar con clínica y ECG.']
    ]),
    initialTreatment: richText(
      { kind: 'paragraph', text: 'La sepsis y el shock séptico son emergencias médicas. La estabilización, el tratamiento antimicrobiano, la búsqueda del foco y el soporte orgánico deben avanzar en paralelo.' },
      { kind: 'heading', text: '1. Oxígeno y soporte respiratorio' },
      { kind: 'paragraph', text: 'Administrar oxígeno cuando exista hipoxemia y escalar soporte según trabajo respiratorio, intercambio gaseoso y evolución.' },
      { kind: 'paragraph', text: 'Considerar cánula nasal de alto flujo, ventilación no invasiva o intubación según indicación clínica, sin retrasar una vía aérea necesaria.' },
      { kind: 'paragraph', text: 'En SDRA o ventilación invasiva, utilizar estrategias protectoras de ventilación según el cuadro respiratorio.' },
      { kind: 'heading', text: '2. Acceso vascular y monitorización' },
      { kind: 'paragraph', text: 'Obtener acceso vascular adecuado, monitorización de signos vitales y control seriado de perfusión.' },
      { kind: 'paragraph', text: 'En shock, no retrasar vasopresores únicamente por esperar una vía central. Puede iniciarse norepinefrina por una vía periférica adecuada y vigilada mientras se obtiene acceso definitivo cuando sea necesario.' },
      { kind: 'heading', text: '3. Antimicrobianos' },
      { kind: 'paragraph', text: 'En shock séptico o sepsis probable/definida, administrar antimicrobianos inmediatamente, idealmente dentro de la primera hora del reconocimiento.' },
      { kind: 'paragraph', text: 'En posible sepsis SIN shock, realizar una evaluación rápida y limitada en el tiempo de causas infecciosas y no infecciosas. Si persiste la sospecha, iniciar antimicrobianos dentro de las primeras 3 horas desde el reconocimiento.' },
      { kind: 'paragraph', text: 'Elegir tratamiento empírico según:' },
      { kind: 'bullet', items: ['foco probable', 'gravedad', 'epidemiología local', 'colonización o infección previa', 'antibióticos recientes', 'riesgo de microorganismos multirresistentes', 'alergias', 'función renal/hepática', 'inmunosupresión', 'contexto comunitario o sanitario'] },
      { kind: 'paragraph', text: 'No utilizar cobertura para MRSA, doble cobertura gramnegativa o antifúngicos empíricos indiscriminadamente. Reservarlos para factores de riesgo y contexto clínico.' },
      { kind: 'paragraph', text: 'Optimizar dosis según farmacocinética/farmacodinamia y gravedad. Cuando corresponda, utilizar dosis de carga y ajustar mantenimiento a función orgánica.' },
      { kind: 'paragraph', text: 'Reevaluar diariamente para desescalar, estrechar espectro o suspender si se descarta infección.' },
      { kind: 'heading', text: '4. Cultivos' },
      { kind: 'paragraph', text: 'Obtener hemocultivos y otras muestras apropiadas idealmente antes del antimicrobiano, siempre que esto no produzca un retraso clínicamente relevante.' },
      { kind: 'heading', text: '5. Fluidoterapia' },
      { kind: 'paragraph', text: 'En sepsis con hipoperfusión o shock séptico, iniciar cristaloides IV.' },
      { kind: 'paragraph', text: 'Los cristaloides balanceados son una opción preferida para la mayoría de los pacientes.' },
      { kind: 'paragraph', text: 'Como referencia inicial, las guías recomiendan considerar al menos aproximadamente 30 mL/kg durante las primeras 3 horas en pacientes con hipoperfusión inducida por sepsis o shock séptico, pero el volumen debe individualizarse y acompañarse de reevaluación frecuente.' },
      { kind: 'paragraph', text: 'No interpretar 30 mL/kg como una orden automática de administrar volúmenes fijos a todos los pacientes independientemente de su respuesta.' },
      { kind: 'paragraph', text: 'Después de los bolos iniciales, decidir fluidos adicionales según:' },
      { kind: 'bullet', items: ['perfusión', 'relleno capilar', 'presión arterial', 'diuresis', 'lactato en contexto', 'congestión', 'respuesta a elevación pasiva de piernas, mini-bolo, variación de volumen sistólico u otros parámetros dinámicos cuando estén disponibles'] },
      { kind: 'paragraph', text: 'Evitar sobrecarga hídrica.' },
      { kind: 'heading', text: '6. Vasopresores' },
      { kind: 'paragraph', text: 'Si persiste hipotensión durante o después de la evaluación/reanimación inicial, iniciar vasopresores.' },
      { kind: 'paragraph', text: 'Norepinefrina es el vasopresor de primera línea.' },
      { kind: 'paragraph', text: 'Objetivo inicial habitual de PAM: aproximadamente 65 mmHg, individualizando según edad, perfusión, hipertensión crónica y contexto.' },
      { kind: 'paragraph', text: 'Si aumentan los requerimientos de norepinefrina, considerar agregar vasopresina.' },
      { kind: 'paragraph', text: 'Si la PAM continúa inadecuada pese a norepinefrina y vasopresina, considerar epinefrina.' },
      { kind: 'heading', text: '7. Inotrópicos' },
      { kind: 'paragraph', text: 'Ante disfunción cardíaca con hipoperfusión persistente pese a volumen adecuado y presión arterial corregida, considerar un inotrópico. Una estrategia posible es agregar dobutamina a norepinefrina o utilizar epinefrina según contexto.' },
      { kind: 'paragraph', text: 'No utilizar inotrópicos de manera rutinaria sin evidencia de bajo gasto/disfunción cardíaca e hipoperfusión persistente.' },
      { kind: 'heading', text: '8. Control del foco' },
      { kind: 'paragraph', text: 'Buscar activamente focos que necesiten:' },
      { kind: 'bullet', items: ['drenaje', 'cirugía', 'desbridamiento', 'descompresión urinaria', 'descompresión biliar', 'retirada de catéter', 'retirada/revisión de dispositivo', 'otra intervención'] },
      { kind: 'paragraph', text: 'Cuando exista un foco anatómico que requiera intervención, realizar control precoz, idealmente dentro de las primeras horas y, como objetivo práctico, dentro de aproximadamente 6 horas cuando sea factible.' },
      { kind: 'paragraph', text: 'No intentar “estabilizar completamente” durante períodos prolongados un foco que requiere control urgente si la propia infección mantiene el shock.' },
      { kind: 'heading', text: '9. Corticoides en shock refractario' },
      { kind: 'paragraph', text: 'En shock séptico con requerimiento persistente de vasopresores pese a reanimación adecuada, considerar corticoides IV según protocolos de cuidados críticos, habitualmente hidrocortisona.' },
      { kind: 'paragraph', text: 'No utilizarlos de rutina en sepsis sin shock o en pacientes que ya no requieren soporte vasopresor.' },
      { kind: 'heading', text: '10. Glucemia' },
      { kind: 'paragraph', text: 'Monitorizar glucemia. En pacientes críticos con sepsis, iniciar tratamiento con insulina cuando la hiperglucemia persistente alcance aproximadamente 180 mg/dL, evitando hipoglucemia y objetivos excesivamente estrictos.' },
      { kind: 'heading', text: '11. Transfusión' },
      { kind: 'paragraph', text: 'Utilizar una estrategia transfusional restrictiva en ausencia de circunstancias específicas que indiquen otra conducta.' },
      { kind: 'paragraph', text: 'No basar la decisión exclusivamente en un valor aislado de hemoglobina; integrar isquemia, hemorragia, hipoxemia y situación clínica.' },
      { kind: 'heading', text: '12. Profilaxis y soporte general' },
      { kind: 'paragraph', text: 'En pacientes internados críticos:' },
      { kind: 'bullet', items: ['profilaxis farmacológica de tromboembolismo venoso salvo contraindicación', 'prevención de úlcera de estrés en quienes tengan factores de riesgo', 'nutrición enteral temprana cuando sea factible', 'prevención de lesiones por presión, delirium y complicaciones asociadas a cuidados críticos'] },
      { kind: 'heading', text: '13. Bicarbonato' },
      { kind: 'paragraph', text: 'No utilizar bicarbonato de sodio de rutina para mejorar hemodinamia o reducir vasopresores en acidosis láctica por hipoperfusión.' },
      { kind: 'paragraph', text: 'Puede considerarse en situaciones seleccionadas de acidemia metabólica grave asociada a lesión renal aguda, según contexto.' }
    ),
    reassessment: richText(
      { kind: 'paragraph', text: 'La reevaluación debe ser repetida, explícita y vinculada a cada intervención.' },
      { kind: 'paragraph', text: 'Reevaluar:' },
      { kind: 'bullet', items: ['estado mental', 'frecuencia respiratoria y trabajo respiratorio', 'SpO2 e intercambio gaseoso', 'presión arterial y PAM', 'frecuencia y ritmo cardíaco', 'relleno capilar', 'temperatura/moteado de extremidades', 'diuresis', 'lactato seriado si estaba elevado', 'balance hídrico', 'signos de congestión', 'respuesta dinámica a fluidos', 'dosis y tendencia de vasopresores', 'función renal', 'función hepática', 'plaquetas/coagulación', 'glucemia', 'aparición de nueva falla orgánica', 'respuesta del foco clínico', 'resultados de cultivos', 'adecuación del antimicrobiano', 'necesidad de control del foco', 'diagnósticos alternativos'] },
      { kind: 'paragraph', text: 'Preguntas de reevaluación:' },
      { kind: 'bullet', items: ['¿Mejoró realmente la perfusión?', '¿El paciente responde a fluidos o solo acumula volumen?', '¿Necesita iniciar o aumentar vasopresores?', '¿Existe disfunción miocárdica?', '¿Está progresando la insuficiencia respiratoria?', '¿El lactato disminuye y el contexto clínico también mejora?', '¿La diuresis mejora?', '¿El foco está controlado?', '¿Los antimicrobianos cubren el microorganismo y foco probables?', '¿Ya puedo desescalar?', '¿Hay cultivos o imágenes que cambien la estrategia?', '¿Existe otra causa de shock o deterioro?', '¿Necesita UCI o traslado a un centro de mayor complejidad?'] },
      { kind: 'paragraph', text: 'No utilizar un único objetivo aislado para definir éxito de la reanimación.' }
    ),
    disposition: {
      discharge: richText(
        { kind: 'paragraph', text: 'El alta desde la evaluación inicial no corresponde al paciente con sepsis que presenta disfunción orgánica aguda.' },
        { kind: 'paragraph', text: 'Puede considerarse egreso únicamente si, tras evaluación y observación adecuadas, se concluye que no existe sepsis, el foco infeccioso puede manejarse ambulatoriamente, el paciente está hemodinámicamente estable, tolera tratamiento, no presenta hipoxemia ni disfunción orgánica relevante, tiene seguimiento confiable y comprende pautas de alarma.' }
      ),
      admission: richText(
        { kind: 'paragraph', text: 'Indicar internación ante sepsis con disfunción orgánica, necesidad de antimicrobianos IV, requerimiento de fluidos o monitorización, comorbilidades relevantes, foco que requiera estudios/intervención hospitalaria o imposibilidad de manejo ambulatorio seguro.' },
        { kind: 'paragraph', text: 'El nivel de internación debe ajustarse a la gravedad y tendencia.' }
      ),
      criticalCare: richText(
        { kind: 'paragraph', text: 'Indicar UCI o área de cuidados críticos ante:' },
        { kind: 'bullet', items: ['shock séptico', 'necesidad de vasopresores', 'ventilación invasiva o soporte respiratorio avanzado', 'hipoperfusión persistente', 'deterioro rápido', 'falla multiorgánica', 'alteración grave del sensorio', 'necesidad de monitorización invasiva', 'inestabilidad que requiera reevaluación/intervención continua'] },
        { kind: 'paragraph', text: 'Priorizar ingreso temprano a UCI cuando está indicado.' }
      ),
      referral: richText(
        { kind: 'paragraph', text: 'Considerar interconsulta o derivación según foco y recursos:' },
        { kind: 'bullet', items: ['cuidados intensivos', 'infectología', 'cirugía general', 'urología', 'gastroenterología/endoscopia', 'neurocirugía/neurología según contexto', 'obstetricia', 'traumatología', 'cirugía cardiovascular', 'otros equipos'] },
        { kind: 'paragraph', text: 'Derivar a un centro de mayor complejidad si el paciente requiere soporte orgánico, control del foco o recursos no disponibles localmente.' },
        { kind: 'paragraph', text: 'No retrasar reanimación, antimicrobianos ni medidas esenciales durante la organización del traslado.' }
      )
    },
    warningsAndInstructions: richText(
      { kind: 'paragraph', text: 'Para pacientes en quienes finalmente se descarta sepsis y se decide manejo ambulatorio, explicar retorno inmediato ante:' },
      { kind: 'bullet', items: ['dificultad respiratoria', 'respiración rápida o progresiva', 'desmayo o hipotensión sintomática', 'confusión, somnolencia o conducta inhabitual', 'debilidad extrema o incapacidad para mantenerse en pie', 'oliguria o ausencia marcada de orina', 'fiebre persistente con deterioro general', 'hipotermia asociada a deterioro', 'vómitos persistentes o incapacidad para hidratarse', 'dolor intenso o progresivo', 'dolor abdominal con rigidez o distensión', 'dolor lumbar intenso asociado a fiebre', 'ictericia', 'lesiones cutáneas que progresan rápidamente', 'bullas, necrosis o dolor desproporcionado', 'petequias o púrpura', 'convulsiones', 'empeoramiento pese al tratamiento indicado'] },
      { kind: 'paragraph', text: 'Asegurar:' },
      { kind: 'bullet', items: ['instrucciones escritas cuando sea posible', 'pauta clara de antimicrobianos si están indicados', 'seguimiento acorde al foco y gravedad', 'indicación explícita de volver antes si el estado general empeora'] }
    ),
    commonErrors: richText({ kind: 'bullet', items: ['Usar qSOFA como método aislado para descartar sepsis.', 'Esperar hipotensión para reconocer hipoperfusión.', 'Considerar que sepsis exige fiebre o leucocitosis.', 'Retrasar antimicrobianos en shock séptico mientras se completan estudios.', 'Administrar antimicrobianos a todo paciente con posible sepsis sin shock sin una evaluación rápida de diagnósticos alternativos.', 'Retrasar cultivos innecesariamente o, en el extremo opuesto, retrasar antibióticos por esperar cultivos.', 'Administrar 30 mL/kg como volumen rígido e invariable sin reevaluación.', 'Continuar bolos porque el lactato no normaliza pese a congestión o falta de respuesta dinámica.', 'Usar solo presión arterial para juzgar perfusión.', 'Retrasar norepinefrina hasta disponer de acceso venoso central.', 'Elegir antibióticos sin considerar foco, epidemiología local, exposiciones previas y riesgo de resistencia.', 'Mantener espectro excesivamente amplio cuando ya existe información para desescalar.', 'Usar procalcitonina para decidir por sí sola si iniciar antimicrobianos.', 'No buscar control del foco.', 'Demorar cirugía/drenaje intentando normalizar completamente todos los parámetros primero.', 'Omitir revisión de catéteres y dispositivos.', 'No ajustar dosis antimicrobianas a farmacocinética/farmacodinamia y función orgánica.', 'No repetir examen físico después de la reanimación.', 'Interpretar todo lactato elevado como hipovolemia.', 'No reconsiderar diagnósticos no infecciosos cuando la evolución no concuerda.'] }),
    clinicalPearls: richText({ kind: 'bullet', items: ['Sepsis es infección + disfunción orgánica; no es sinónimo de SIRS.', 'La ausencia de fiebre no tranquiliza.', 'qSOFA puede señalar riesgo, pero no debe utilizarse como herramienta aislada para descartar sepsis.', 'La hipoperfusión puede preceder a la hipotensión.', 'El relleno capilar y otros datos periféricos aportan información útil junto con lactato, presión arterial y diuresis.', 'Lactato es un marcador de riesgo y metabolismo alterado, no un “medidor de volumen intravascular”.', 'Los cultivos son importantes, pero no deben retrasar antimicrobianos urgentes.', 'En shock séptico, el tiempo hasta antimicrobianos importa.', 'En posible sepsis sin shock, una evaluación rápida puede evitar antibióticos innecesarios.', 'Norepinefrina es el vasopresor inicial de elección.', 'La vía periférica adecuada puede permitir iniciar vasopresores sin esperar una vía central.', 'Una PAM cercana a 65 mmHg es un objetivo inicial, no un objetivo universal inmutable.', 'La respuesta a fluidos debe demostrarse y reevaluarse.', '“Más fluidos” no es sinónimo de “más reanimación”.', 'El control del foco puede ser tan importante como el antibiótico.', 'Una obstrucción urinaria o biliar infectada necesita descompresión.', 'Una infección necrotizante necesita cirugía urgente.', 'El tratamiento antimicrobiano debe revisarse diariamente para desescalar.', 'La evolución clínica manda: si el paciente no mejora, revisar foco, antimicrobianos, perfusión y diagnóstico.', 'La sepsis es dinámica; cada intervención exige una nueva evaluación.'] })
  };
}

const sepsisDecisionTree: DecisionTree = {
  rootNodeId: 'sepsis-n01',
  nodes: [
    { id: 'sepsis-n01', type: 'start', title: 'Paciente con infección sospechada o confirmada y deterioro clínico', description: 'Iniciar evaluación inmediata de estabilidad, perfusión y disfunción orgánica mientras se busca el foco probable.' },
    { id: 'sepsis-n02', type: 'question', title: '¿Existe inestabilidad vital, shock o hipoperfusión?', description: 'Buscar hipotensión, alteración mental, relleno capilar prolongado, moteado, oliguria, lactato elevado en contexto compatible o deterioro rápido.' },
    { id: 'sepsis-n03', type: 'action', title: 'ABC, monitorización y acceso vascular', description: 'Estabilizar vía aérea y respiración, administrar oxígeno si corresponde, monitorizar, obtener acceso vascular y evaluar perfusión en paralelo.' },
    { id: 'sepsis-n04', type: 'action', title: 'Obtener lactato y cultivos sin retrasar tratamiento', description: 'Medir lactato cuando esté indicado y obtener hemocultivos y muestras pertinentes idealmente antes de antimicrobianos si no produce una demora clínicamente relevante.' },
    { id: 'sepsis-n05', type: 'action', title: 'Iniciar antimicrobianos inmediatamente', description: 'En shock séptico o sepsis probable/definida, administrar tratamiento empírico apropiado de inmediato, idealmente dentro de la primera hora del reconocimiento.' },
    { id: 'sepsis-n06', type: 'question', title: '¿Hay hipoperfusión inducida por sepsis o shock séptico?', description: 'Integrar presión arterial, perfusión periférica, estado mental, diuresis, lactato y contexto.' },
    { id: 'sepsis-n07', type: 'action', title: 'Iniciar cristaloides con reevaluación frecuente', description: 'Usar cristaloides como primera línea, preferentemente balanceados en la mayoría. Considerar al menos aproximadamente 30 mL/kg en las primeras 3 horas en hipoperfusión o shock, individualizando según respuesta y comorbilidades.' },
    { id: 'sepsis-n08', type: 'question', title: '¿La hipotensión persiste o el shock es inestable?', description: 'No retrasar soporte vasopresor cuando la presión y perfusión son inadecuadas.' },
    { id: 'sepsis-n09', type: 'action', title: 'Iniciar norepinefrina', description: 'Norepinefrina es el vasopresor de primera línea. Puede iniciarse por una vía periférica adecuada y vigilada mientras se obtiene acceso definitivo si es necesario.' },
    { id: 'sepsis-n10', type: 'action', title: 'Objetivo inicial de PAM ≈ 65 mmHg', description: 'Usar aproximadamente 65 mmHg como objetivo inicial y ajustar según perfusión, edad, hipertensión crónica y contexto.' },
    { id: 'sepsis-n11', type: 'question', title: '¿Persiste hipoperfusión después de la reanimación inicial?', description: 'Reevaluar clínica, relleno capilar, lactato seriado si estaba elevado, diuresis, congestión y respuesta dinámica a fluidos.' },
    { id: 'sepsis-n12', type: 'question', title: '¿Responde a fluidos adicionales?', description: 'Utilizar medidas dinámicas cuando sea posible: elevación pasiva de piernas, mini-bolo o cambios en volumen sistólico/presión de pulso.' },
    { id: 'sepsis-n13', type: 'action', title: 'Administrar fluidos adicionales individualizados', description: 'Dar bolos adicionales solo cuando exista probabilidad razonable de respuesta y ausencia de sobrecarga significativa.' },
    { id: 'sepsis-n14', type: 'warning', title: 'Evitar sobrecarga y fluidos indiscriminados', description: 'No continuar administrando volumen solo porque el lactato permanece elevado o porque aún existe hipotensión si el paciente no responde a fluidos.' },
    { id: 'sepsis-n15', type: 'question', title: '¿Escalan los requerimientos de norepinefrina?', description: 'Valorar tendencia de dosis, perfusión y presión arterial.' },
    { id: 'sepsis-n16', type: 'action', title: 'Agregar vasopresina', description: 'Considerar vasopresina cuando aumentan los requerimientos de norepinefrina.' },
    { id: 'sepsis-n17', type: 'question', title: '¿La PAM sigue inadecuada con norepinefrina + vasopresina?', description: 'Confirmar adecuada evaluación de volumen, perfusión y otras causas de shock.' },
    { id: 'sepsis-n18', type: 'action', title: 'Considerar epinefrina', description: 'Agregar epinefrina si la presión arterial continúa siendo inadecuada pese a norepinefrina y vasopresina, según contexto.' },
    { id: 'sepsis-n19', type: 'question', title: '¿Existe disfunción cardíaca con hipoperfusión persistente?', description: 'Considerar ecocardiografía/POCUS y signos de bajo gasto cuando la perfusión sigue alterada pese a presión y volumen razonablemente corregidos.' },
    { id: 'sepsis-n20', type: 'action', title: 'Considerar soporte inotrópico', description: 'En disfunción cardíaca con hipoperfusión persistente puede considerarse dobutamina añadida a norepinefrina o una estrategia con epinefrina, individualizando.' },
    { id: 'sepsis-n21', type: 'question', title: '¿Existe un foco que requiera control invasivo?', description: 'Buscar absceso, perforación, infección necrotizante, obstrucción urinaria o biliar, catéter/dispositivo infectado u otra fuente anatómica tratable.' },
    { id: 'sepsis-n22', type: 'action', title: 'Control precoz del foco', description: 'Coordinar drenaje, cirugía, desbridamiento, descompresión o retirada de dispositivo. Cuando corresponda, realizarlo idealmente dentro de aproximadamente 6 horas.' },
    { id: 'sepsis-n23', type: 'question', title: '¿El paciente está estable y SIN shock?', description: 'Si no hay inestabilidad, evaluar probabilidad real de infección y presencia de disfunción orgánica.' },
    { id: 'sepsis-n24', type: 'question', title: '¿La sepsis es probable/definida o hay disfunción orgánica atribuible a infección?', description: 'Integrar clínica, foco, laboratorio y evolución. No usar qSOFA o un biomarcador aislado para excluir sepsis.' },
    { id: 'sepsis-n25', type: 'action', title: 'Antimicrobianos tempranos y evaluación etiológica', description: 'Si la sepsis es probable o definida, iniciar antimicrobianos de inmediato y continuar búsqueda microbiológica y anatómica del foco.' },
    { id: 'sepsis-n26', type: 'action', title: 'Evaluación rápida de posible sepsis sin shock', description: 'Si solo es posible sepsis y no hay shock, realizar una evaluación clínica rápida y limitada en el tiempo de causas infecciosas y no infecciosas.' },
    { id: 'sepsis-n27', type: 'question', title: '¿Persiste la sospecha de infección tras la evaluación rápida?', description: 'Revisar historia, examen, estudios iniciales, foco y diagnósticos alternativos.' },
    { id: 'sepsis-n28', type: 'action', title: 'Iniciar antimicrobianos dentro de 3 horas', description: 'Si persiste la sospecha de infección en posible sepsis sin shock, iniciar antimicrobianos dentro de las primeras 3 horas desde el reconocimiento.' },
    { id: 'sepsis-n29', type: 'question', title: '¿Hay mejoría clínica y control del foco?', description: 'Reevaluar perfusión, función orgánica, cultivos, respuesta al tratamiento, necesidad de desescalamiento y diagnósticos alternativos.' },
    { id: 'sepsis-n30', type: 'disposition', title: 'Definir nivel de cuidado y disposición', description: 'UCI ante shock, vasopresores, soporte respiratorio avanzado, hipoperfusión persistente o falla multiorgánica; internación según gravedad; derivación si requiere recursos no disponibles. Alta solo si finalmente se descarta sepsis y el manejo ambulatorio es seguro.' }
  ],
  edges: [
    { id: 'sepsis-e01', from: 'sepsis-n01', to: 'sepsis-n02', label: 'Evaluar' },
    { id: 'sepsis-e02', from: 'sepsis-n02', to: 'sepsis-n03', label: 'Sí' },
    { id: 'sepsis-e03', from: 'sepsis-n02', to: 'sepsis-n23', label: 'No' },
    { id: 'sepsis-e04', from: 'sepsis-n03', to: 'sepsis-n04', label: 'Continuar' },
    { id: 'sepsis-e05', from: 'sepsis-n04', to: 'sepsis-n05', label: 'Shock o sepsis probable/definida' },
    { id: 'sepsis-e06', from: 'sepsis-n05', to: 'sepsis-n06', label: 'Evaluar perfusión' },
    { id: 'sepsis-e07', from: 'sepsis-n06', to: 'sepsis-n07', label: 'Sí' },
    { id: 'sepsis-e08', from: 'sepsis-n06', to: 'sepsis-n21', label: 'No' },
    { id: 'sepsis-e09', from: 'sepsis-n07', to: 'sepsis-n08', label: 'Reevaluar' },
    { id: 'sepsis-e10', from: 'sepsis-n08', to: 'sepsis-n09', label: 'Sí' },
    { id: 'sepsis-e11', from: 'sepsis-n08', to: 'sepsis-n11', label: 'No' },
    { id: 'sepsis-e12', from: 'sepsis-n09', to: 'sepsis-n10', label: 'Titular' },
    { id: 'sepsis-e13', from: 'sepsis-n10', to: 'sepsis-n11', label: 'Reevaluar' },
    { id: 'sepsis-e14', from: 'sepsis-n11', to: 'sepsis-n12', label: 'Sí' },
    { id: 'sepsis-e15', from: 'sepsis-n11', to: 'sepsis-n21', label: 'No' },
    { id: 'sepsis-e16', from: 'sepsis-n12', to: 'sepsis-n13', label: 'Sí' },
    { id: 'sepsis-e17', from: 'sepsis-n12', to: 'sepsis-n14', label: 'No' },
    { id: 'sepsis-e18', from: 'sepsis-n13', to: 'sepsis-n15', label: 'Reevaluar vasopresor' },
    { id: 'sepsis-e19', from: 'sepsis-n14', to: 'sepsis-n15', label: 'Priorizar soporte apropiado' },
    { id: 'sepsis-e20', from: 'sepsis-n15', to: 'sepsis-n16', label: 'Sí' },
    { id: 'sepsis-e21', from: 'sepsis-n15', to: 'sepsis-n19', label: 'No' },
    { id: 'sepsis-e22', from: 'sepsis-n16', to: 'sepsis-n17', label: 'Reevaluar PAM' },
    { id: 'sepsis-e23', from: 'sepsis-n17', to: 'sepsis-n18', label: 'Sí' },
    { id: 'sepsis-e24', from: 'sepsis-n17', to: 'sepsis-n19', label: 'No' },
    { id: 'sepsis-e25', from: 'sepsis-n18', to: 'sepsis-n19', label: 'Reevaluar perfusión' },
    { id: 'sepsis-e26', from: 'sepsis-n19', to: 'sepsis-n20', label: 'Sí' },
    { id: 'sepsis-e27', from: 'sepsis-n19', to: 'sepsis-n21', label: 'No' },
    { id: 'sepsis-e28', from: 'sepsis-n20', to: 'sepsis-n21', label: 'Continuar' },
    { id: 'sepsis-e29', from: 'sepsis-n21', to: 'sepsis-n22', label: 'Sí' },
    { id: 'sepsis-e30', from: 'sepsis-n21', to: 'sepsis-n29', label: 'No' },
    { id: 'sepsis-e31', from: 'sepsis-n22', to: 'sepsis-n29', label: 'Reevaluar respuesta' },
    { id: 'sepsis-e32', from: 'sepsis-n23', to: 'sepsis-n24', label: 'Sí' },
    { id: 'sepsis-e33', from: 'sepsis-n24', to: 'sepsis-n25', label: 'Sí' },
    { id: 'sepsis-e34', from: 'sepsis-n24', to: 'sepsis-n26', label: 'No / posible sepsis' },
    { id: 'sepsis-e35', from: 'sepsis-n25', to: 'sepsis-n21', label: 'Buscar foco' },
    { id: 'sepsis-e36', from: 'sepsis-n26', to: 'sepsis-n27', label: 'Reevaluar rápidamente' },
    { id: 'sepsis-e37', from: 'sepsis-n27', to: 'sepsis-n28', label: 'Sí' },
    { id: 'sepsis-e38', from: 'sepsis-n27', to: 'sepsis-n29', label: 'No' },
    { id: 'sepsis-e39', from: 'sepsis-n28', to: 'sepsis-n21', label: 'Buscar foco' },
    { id: 'sepsis-e40', from: 'sepsis-n29', to: 'sepsis-n30', label: 'Mejoró o requiere nivel de cuidado' },
    { id: 'sepsis-e41', from: 'sepsis-n23', to: 'sepsis-n03', label: 'No / aparece inestabilidad' }
  ]
};

export function createSepsisClinicalApproach(userId: string): ClinicalApproach {
  const timestamp = new Date().toISOString();
  const content: ClinicalApproachContent = {
    ...createSepsisApproachBaseContent(),
    decisionTree: sepsisDecisionTree,
    relatedContent: []
  };
  const validation = validateDecisionTree(content.decisionTree);
  if (validation.errors.length > 0 || validation.warnings.length > 0) {
    const issues = [...validation.errors, ...validation.warnings].map((issue) => issue.message).join(' ');
    throw new Error(`El fixture de Sepsis contiene un árbol inválido: ${issues}`);
  }
  return {
    id: crypto.randomUUID(),
    userId,
    title: SEPSIS_APPROACH_TITLE,
    description: SEPSIS_APPROACH_DESCRIPTION,
    categoryId: null,
    category: null,
    content,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'complete'
  };
}
