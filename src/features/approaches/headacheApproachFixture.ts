import type { TipTapDocument } from '../../types/topic';
import type { ClinicalApproach, ClinicalApproachContent, ComplementaryStudy, DecisionTree, DifferentialDiagnosisItem, ReasoningItem } from './clinicalApproachTypes';
import { validateDecisionTree } from './decisionTreeValidation';

type TextBlock = { kind: 'paragraph' | 'heading'; text: string } | { kind: 'bullet'; items: string[] };
type HeadacheApproachBaseContent = Pick<ClinicalApproachContent,
  'version' | 'presentation' | 'initialAssessment' | 'lifeThreats' | 'anamnesis' | 'physicalExam' |
  'differentialDiagnosis' | 'complementaryStudies' | 'initialTreatment' | 'reassessment' | 'disposition' |
  'warningsAndInstructions' | 'commonErrors' | 'clinicalPearls'
>;

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
  id: stableId(6, index + 1), name, whenToOrder: paragraph(whenToOrder), targetFinding: paragraph(targetFinding), interpretation: paragraph(interpretation)
}));

export const HEADACHE_APPROACH_TITLE = 'Cefalea';
export const HEADACHE_APPROACH_DESCRIPTION = 'Abordaje inicial del paciente con cefalea aguda, subaguda o recurrente, orientado a reconocer cefaleas secundarias potencialmente graves, identificar signos de alarma, diferenciar patrones primarios frecuentes, seleccionar estudios y definir tratamiento, reevaluación y disposición.';

export function createHeadacheApproachBaseContent(): HeadacheApproachBaseContent {
  return {
    version: 1,
    presentation: richText(
      { kind: 'paragraph', text: 'La cefalea es un motivo de consulta frecuente y comprende desde trastornos primarios benignos hasta enfermedades neurológicas, vasculares, infecciosas, oftalmológicas o sistémicas potencialmente mortales.' },
      { kind: 'paragraph', text: 'El objetivo inicial no es clasificar de inmediato todas las cefaleas, sino responder de forma ordenada:' },
      { kind: 'bullet', items: ['¿Existe una emergencia neurológica o sistémica?', '¿Hay signos de alarma que sugieran cefalea secundaria?', '¿El patrón es compatible con una cefalea primaria conocida?', '¿Se requieren estudios urgentes?', '¿El paciente puede manejarse ambulatoriamente o necesita observación, internación o evaluación especializada?'] },
      { kind: 'paragraph', text: 'La ausencia de focalidad neurológica no excluye por sí sola una causa secundaria importante.' }
    ),
    initialAssessment: richText(
      { kind: 'paragraph', text: 'Evaluar inicialmente:' },
      { kind: 'bullet', items: ['vía aérea', 'respiración', 'circulación', 'presión arterial', 'frecuencia cardíaca', 'frecuencia respiratoria', 'temperatura', 'saturación de oxígeno', 'estado de conciencia', 'glucemia cuando corresponda', 'intensidad y velocidad de instauración del dolor'] },
      { kind: 'paragraph', text: 'Buscar inmediatamente:' },
      { kind: 'bullet', items: ['alteración del sensorio', 'déficit neurológico focal', 'convulsiones', 'rigidez de nuca', 'fiebre con compromiso sistémico', 'papiledema', 'hipertensión severa con daño de órgano blanco', 'pérdida visual aguda', 'dolor ocular intenso', 'trauma craneal relevante', 'embarazo o puerperio con síntomas neurológicos', 'inmunosupresión', 'anticoagulación', 'cefalea de máxima intensidad desde el inicio'] },
      { kind: 'paragraph', text: 'Ante inestabilidad o deterioro neurológico, estabilización y diagnóstico deben realizarse simultáneamente.' }
    ),
    lifeThreats: richText(
      { kind: 'paragraph', text: 'Las principales causas potencialmente mortales o tiempo-dependientes de cefalea incluyen:' },
      { kind: 'bullet', items: ['hemorragia subaracnoidea', 'hemorragia intracerebral', 'meningitis / encefalitis', 'trombosis venosa cerebral', 'disección carotídea o vertebral', 'evento cerebrovascular', 'crisis hipertensiva con encefalopatía', 'hipertensión endocraneana por masa, hidrocefalia u otras causas', 'arteritis de células gigantes con compromiso visual', 'glaucoma agudo de ángulo cerrado', 'preeclampsia/eclampsia', 'intoxicación por monóxido de carbono', 'infección intracraneal', 'apoplejía hipofisaria'] },
      { kind: 'heading', text: 'Hemorragia subaracnoidea' }, { kind: 'paragraph', text: 'Considerar especialmente ante cefalea súbita, de máxima intensidad al inicio, descrita como “la peor cefalea de la vida”, desencadenada por esfuerzo, actividad sexual o Valsalva, o acompañada de vómitos, pérdida de conciencia, rigidez nucal o déficit neurológico.' },
      { kind: 'heading', text: 'Hemorragia intracerebral' }, { kind: 'paragraph', text: 'Puede presentarse con cefalea, focalidad, disminución del nivel de conciencia, vómitos, hipertensión severa o convulsiones.' },
      { kind: 'heading', text: 'Meningitis / encefalitis' }, { kind: 'paragraph', text: 'Pensar ante cefalea con fiebre, rigidez de nuca, fotofobia, alteración del sensorio, convulsiones o compromiso sistémico. La tríada clásica puede estar incompleta.' },
      { kind: 'heading', text: 'Trombosis venosa cerebral' }, { kind: 'paragraph', text: 'Considerar especialmente en embarazo/puerperio, estados protrombóticos, uso de estrógenos, neoplasia, infecciones o deshidratación. Puede producir cefalea aislada, déficit focal, convulsiones o hipertensión endocraneana.' },
      { kind: 'heading', text: 'Disección carotídea o vertebral' }, { kind: 'paragraph', text: 'Puede manifestarse con cefalea o cervicalgia unilateral, síndrome de Horner, síntomas isquémicos o antecedente de trauma/manipulación cervical.' },
      { kind: 'heading', text: 'Hipertensión endocraneana' }, { kind: 'paragraph', text: 'Considerar ante cefalea progresiva, vómitos, papiledema, alteración del sensorio, focalidad o empeoramiento con Valsalva.' },
      { kind: 'heading', text: 'Arteritis de células gigantes' }, { kind: 'paragraph', text: 'Considerar sobre todo en mayores de 50 años con nueva cefalea, dolor temporal, claudicación mandibular, síntomas constitucionales o alteración visual.' },
      { kind: 'heading', text: 'Glaucoma agudo de ángulo cerrado' }, { kind: 'paragraph', text: 'Puede producir dolor ocular y cefalea intensa, visión borrosa, halos, ojo rojo, náuseas y vómitos.' },
      { kind: 'heading', text: 'Preeclampsia/eclampsia' }, { kind: 'paragraph', text: 'Considerar en embarazo o puerperio ante cefalea nueva, hipertensión, alteraciones visuales, dolor epigástrico, convulsiones u otros signos de disfunción orgánica.' },
      { kind: 'heading', text: 'Apoplejía hipofisaria' }, { kind: 'paragraph', text: 'Puede causar cefalea súbita intensa, alteraciones visuales, oftalmoplejía y compromiso endocrino agudo.' }
    ),
    anamnesis: reasoning(1, [
      ['Inicio y velocidad de instauración', 'Preguntar cuándo comenzó la cefalea y cuánto tiempo tardó en alcanzar su máxima intensidad.', 'Una cefalea que alcanza máxima intensidad en segundos o pocos minutos obliga a considerar hemorragia subaracnoidea y otras causas vasculares.'],
      ['Primera cefalea o cambio de patrón', 'Preguntar si es la primera cefalea de este tipo o si difiere de episodios previos.', 'Una cefalea nueva o claramente distinta al patrón habitual aumenta la sospecha de causa secundaria.'],
      ['Localización', 'Determinar si el dolor es unilateral, bilateral, frontal, temporal, occipital, retroocular o difuso.', 'La localización puede orientar, aunque rara vez es diagnóstica por sí sola.'],
      ['Características del dolor', 'Preguntar si es pulsátil, opresiva, punzante, explosiva, eléctrica o constante.', 'Puede ayudar a reconocer patrones compatibles con migraña, cefalea tensional, neuralgias o causas secundarias.'],
      ['Duración', 'Determinar cuánto dura cada episodio y si el dolor es continuo o episódico.', 'La duración orienta hacia distintos síndromes primarios y secundarios.'],
      ['Desencadenantes', 'Preguntar por esfuerzo físico, actividad sexual, tos, estornudo, Valsalva, cambios posturales, ejercicio o movimientos cervicales.', 'Las cefaleas precipitadas por esfuerzo, Valsalva o actividad sexual pueden requerir evaluación de causas secundarias, especialmente si son nuevas o explosivas.'],
      ['Relación con la postura', 'Preguntar si empeora al estar de pie, acostarse o cambiar de posición.', 'Puede orientar hacia alteraciones de presión del líquido cefalorraquídeo o hipertensión endocraneana.'],
      ['Síntomas neurológicos', 'Preguntar por debilidad, alteraciones sensitivas, dificultad para hablar, diplopía, ataxia, vértigo, confusión o pérdida de conciencia.', 'Aumentan la sospecha de evento vascular, lesión estructural, disección u otras causas neurológicas secundarias.'],
      ['Aura', 'Preguntar por síntomas visuales, sensitivos o del lenguaje que preceden o acompañan la cefalea y su forma de aparición y resolución.', 'Un aura migrañosa típica suele evolucionar gradualmente y ser reversible. Déficits súbitos o persistentes obligan a considerar otras etiologías.'],
      ['Náuseas, vómitos, fotofobia y fonofobia', 'Preguntar por síntomas asociados característicos de migraña.', 'Apoyan el diagnóstico de migraña, aunque no excluyen causas secundarias.'],
      ['Fiebre y síntomas infecciosos', 'Preguntar por fiebre, rigidez cervical, exantema, infección reciente, sinusitis, otitis o inmunosupresión.', 'Aumentan la preocupación por meningitis, encefalitis o infección intracraneal.'],
      ['Síntomas visuales', 'Preguntar por pérdida visual, visión borrosa, diplopía, halos, escotomas o amaurosis transitoria.', 'Puede orientar hacia migraña, glaucoma, arteritis de células gigantes, enfermedad vascular o hipertensión endocraneana.'],
      ['Síntomas autonómicos', 'Preguntar por lagrimeo, congestión nasal, rinorrea, ptosis o inquietud motora durante la cefalea.', 'Pueden orientar hacia cefaleas trigémino-autonómicas como cefalea en racimos.'],
      ['Trauma', 'Preguntar por traumatismo craneal reciente, incluso aparentemente menor.', 'Puede existir hemorragia intracraneal, especialmente en pacientes anticoagulados, adultos mayores o con trastornos de coagulación.'],
      ['Edad de inicio', 'Registrar edad y si la cefalea apareció de novo en edad mayor.', 'Una cefalea nueva después de los 50 años aumenta la probabilidad de causas secundarias, incluida arteritis de células gigantes y lesiones estructurales.'],
      ['Embarazo y puerperio', 'Preguntar por embarazo actual, semanas de gestación y puerperio reciente.', 'Aumenta la preocupación por preeclampsia/eclampsia, trombosis venosa cerebral, síndrome de vasoconstricción cerebral reversible y otras causas vasculares.'],
      ['Inmunosupresión y cáncer', 'Preguntar por neoplasias, VIH, trasplante, inmunosupresores o corticoides prolongados.', 'Aumentan la probabilidad de infección intracraneal, lesiones ocupantes de espacio y otras cefaleas secundarias.'],
      ['Anticoagulación y trastornos hemorrágicos', 'Preguntar por anticoagulantes, antiagregantes, hemofilia u otros trastornos de coagulación.', 'Incrementan el riesgo de hemorragia intracraneal.'],
      ['Medicaciones y consumo de analgésicos', 'Preguntar por frecuencia de uso de analgésicos, triptanes, opioides, cafeína y otros medicamentos.', 'El uso frecuente de medicación sintomática puede producir cefalea por sobreuso de medicamentos.'],
      ['Exposición a monóxido de carbono', 'Preguntar por calefactores, combustión, ambientes cerrados y síntomas similares en convivientes.', 'La intoxicación por monóxido de carbono puede manifestarse con cefalea, mareos, náuseas y alteración neurológica.']
    ]),
    physicalExam: reasoning(2, [
      ['Signos vitales', 'Evaluar presión arterial, frecuencia cardíaca, temperatura, frecuencia respiratoria y saturación.', 'Fiebre, hipertensión severa o alteraciones sistémicas pueden orientar hacia causas secundarias.'],
      ['Estado mental', 'Evaluar orientación, atención, lenguaje, conducta y nivel de conciencia.', 'La alteración del sensorio es un signo de alarma y puede indicar infección, hemorragia, hipertensión endocraneana, toxicidad o encefalopatía.'],
      ['Examen neurológico focal', 'Evaluar pares craneales, fuerza, sensibilidad, lenguaje, coordinación y campos visuales.', 'La focalidad aumenta la probabilidad de enfermedad vascular, estructural o infecciosa del sistema nervioso central.'],
      ['Signos meníngeos', 'Evaluar rigidez cervical y otros signos de irritación meníngea dentro del contexto clínico.', 'Pueden apoyar meningitis o hemorragia subaracnoidea, aunque su ausencia no las excluye.'],
      ['Fondo de ojo / papiledema', 'Buscar papiledema cuando sea posible y clínicamente indicado.', 'Sugiere hipertensión endocraneana y modifica la estrategia diagnóstica antes de una punción lumbar.'],
      ['Pupilas y motilidad ocular', 'Evaluar tamaño y reactividad pupilar, movimientos oculares, diplopía y oftalmoplejía.', 'Puede revelar aneurismas, apoplejía hipofisaria, glaucoma, hipertensión endocraneana u otras causas neurológicas.'],
      ['Examen ocular', 'Evaluar ojo rojo, dolor ocular, agudeza visual cuando corresponda y otros hallazgos oftalmológicos.', 'Permite reconocer glaucoma agudo y otras causas oftalmológicas de cefalea.'],
      ['Arterias temporales', 'En mayores de 50 años, palpar arterias temporales y preguntar por dolor o sensibilidad.', 'Puede apoyar el diagnóstico de arteritis de células gigantes.'],
      ['Cuello', 'Evaluar rigidez, dolor cervical, movilidad y antecedentes de trauma o manipulación.', 'Puede aportar datos para meningismo, disección vascular o cefalea cervicogénica.'],
      ['Piel y exantemas', 'Buscar petequias, púrpura, lesiones herpéticas u otros hallazgos cutáneos.', 'Puede apoyar infección meningocócica, herpes zóster u otras causas infecciosas.'],
      ['Signos autonómicos craneales', 'Buscar lagrimeo, rinorrea, congestión nasal, ptosis o miosis.', 'Pueden orientar hacia cefaleas trigémino-autonómicas o, en ciertos contextos, síndrome de Horner por disección carotídea.'],
      ['Evaluación obstétrica contextual', 'En embarazo o puerperio, valorar presión arterial y signos de preeclampsia según el contexto clínico.', 'La cefalea puede ser una manifestación de preeclampsia, eclampsia o enfermedad cerebrovascular asociada.']
    ]),
    differentialDiagnosis: {
      lifeThreatening: differentials(3, [
        ['Hemorragia subaracnoidea', 'Debe considerarse especialmente ante cefalea súbita de máxima intensidad al inicio, con o sin rigidez nucal, vómitos, síncope o déficit neurológico.'],
        ['Hemorragia intracerebral', 'Puede producir cefalea, focalidad, convulsiones, vómitos y alteración del nivel de conciencia.'],
        ['Meningitis / encefalitis', 'Cefalea con fiebre, rigidez cervical, alteración del sensorio, convulsiones o compromiso sistémico requiere evaluación urgente.'],
        ['Trombosis venosa cerebral', 'Puede manifestarse como cefalea aislada o acompañada de convulsiones, focalidad o hipertensión endocraneana.'],
        ['Disección carotídea o vertebral', 'Puede producir cefalea o cervicalgia unilateral junto con síndrome de Horner o síntomas isquémicos.'],
        ['Evento cerebrovascular', 'La cefalea puede acompañar determinados ACV, especialmente hemorrágicos o de circulación posterior.'],
        ['Hipertensión endocraneana', 'Puede resultar de masa, hidrocefalia, trombosis venosa u otras causas y producir papiledema, vómitos y deterioro neurológico.'],
        ['Preeclampsia / eclampsia', 'Cefalea nueva en embarazo o puerperio asociada a hipertensión u otros signos de disfunción orgánica requiere evaluación urgente.'],
        ['Arteritis de células gigantes', 'Puede producir pérdida visual irreversible si el tratamiento se retrasa.'],
        ['Glaucoma agudo de ángulo cerrado', 'Emergencia oftalmológica con dolor ocular, cefalea, ojo rojo y alteraciones visuales.'],
        ['Infección intracraneal / absceso cerebral', 'Puede producir cefalea, fiebre, focalidad, convulsiones o signos de hipertensión endocraneana.'],
        ['Apoplejía hipofisaria', 'Causa cefalea súbita intensa, déficit visual, oftalmoplejía y posible insuficiencia endocrina aguda.'],
        ['Intoxicación por monóxido de carbono', 'Puede producir cefalea, mareos, náuseas, confusión y pérdida de conciencia.']
      ]),
      common: differentials(4, [
        ['Migraña sin aura', 'Cefalea recurrente, habitualmente de horas de duración, con frecuencia pulsátil y de intensidad moderada a severa, que puede asociarse a náuseas, fotofobia, fonofobia y empeoramiento con la actividad física habitual.'],
        ['Migraña con aura', 'Migraña precedida o acompañada por síntomas neurológicos focales completamente reversibles, habitualmente visuales, sensitivos o del lenguaje, que típicamente se desarrollan de manera gradual.'],
        ['Cefalea tensional', 'Suele ser bilateral, opresiva o en banda, de intensidad leve a moderada y sin empeoramiento marcado con la actividad física habitual. Generalmente no presenta los síntomas vegetativos prominentes de la migraña.'],
        ['Cefalea en racimos', 'Cefalea unilateral muy intensa, habitualmente orbital, supraorbitaria o temporal, asociada a signos autonómicos ipsilaterales como lagrimeo, congestión nasal, rinorrea, ptosis o miosis y, con frecuencia, inquietud motora.'],
        ['Cefalea asociada a infección viral', 'Puede acompañar cuadros virales sistémicos y suele coexistir con fiebre, mialgias u otros síntomas infecciosos. Deben buscarse signos que sugieran compromiso del sistema nervioso central.'],
        ['Cefalea cervicogénica', 'Dolor relacionado con estructuras cervicales, a menudo asociado a cervicalgia, limitación del movimiento o provocación con determinadas posiciones o maniobras.'],
        ['Cefalea por sobreuso de medicamentos', 'Debe considerarse en pacientes con cefalea frecuente que utilizan medicación sintomática de forma reiterada. El patrón puede transformarse en una cefalea casi diaria o persistente.'],
        ['Cefalea asociada a privación de sueño', 'La falta de sueño puede desencadenar o agravar cefaleas, especialmente en personas predispuestas a migraña o cefalea tensional.'],
        ['Cefalea por deshidratación', 'Puede aparecer en contexto de ingesta insuficiente, pérdidas gastrointestinales, calor o ejercicio y suele mejorar al corregir el déficit de volumen cuando no existe otra causa.'],
        ['Sinusitis con criterios clínicos compatibles', 'La cefalea atribuible a sinusitis debe acompañarse de un cuadro clínico compatible con enfermedad rinosinusal. El dolor facial aislado o una cefalea recurrente sin síntomas nasales no demuestra sinusitis.']
      ]),
      contextual: differentials(5, [
        ['Neuralgia del trigémino', 'Episodios breves de dolor facial intenso, tipo descarga eléctrica, en el territorio de una o más ramas del trigémino, frecuentemente desencadenados por estímulos inocuos.'],
        ['Neuralgia occipital', 'Dolor paroxístico punzante o eléctrico en el territorio de los nervios occipitales, a veces acompañado de sensibilidad local.'],
        ['Cefalea primaria por tos', 'Cefalea desencadenada por tos u otras maniobras de Valsalva. Cuando es nueva requiere excluir causas secundarias antes de considerarla primaria.'],
        ['Cefalea primaria por ejercicio', 'Se relaciona temporalmente con actividad física intensa. Una primera presentación explosiva obliga a descartar etiologías vasculares secundarias.'],
        ['Cefalea asociada a actividad sexual', 'Puede aparecer durante la excitación o alcanzar máxima intensidad con el orgasmo. En una primera presentación intensa o súbita deben excluirse causas vasculares.'],
        ['Síndrome de vasoconstricción cerebral reversible', 'Característicamente produce cefaleas en trueno recurrentes y puede asociarse a complicaciones isquémicas o hemorrágicas. Debe considerarse en contextos predisponentes, incluido el puerperio y determinadas exposiciones farmacológicas.'],
        ['Hipertensión intracraneana idiopática', 'Puede producir cefalea, papiledema, síntomas visuales y tinnitus pulsátil, sin una lesión estructural responsable evidente.'],
        ['Hipotensión intracraneana espontánea', 'Suele causar cefalea ortostática que empeora al ponerse de pie y mejora al acostarse, aunque el patrón puede variar con la evolución.'],
        ['Tumor cerebral', 'Puede producir cefalea progresiva, convulsiones, focalidad, alteraciones cognitivas o signos de hipertensión endocraneana.'],
        ['Hidrocefalia', 'Puede ocasionar cefalea, vómitos, alteración de la marcha, deterioro cognitivo o signos de hipertensión endocraneana según el contexto y la velocidad de instalación.'],
        ['Sinusitis complicada', 'La extensión orbitaria o intracraneal de una infección sinusal puede producir cefalea intensa, fiebre, edema orbitario, alteraciones visuales, focalidad o compromiso neurológico.'],
        ['Otitis / mastoiditis', 'Las infecciones óticas pueden causar dolor referido y, cuando se complican, asociarse a infección intracraneal o trombosis venosa.'],
        ['Trastornos temporomandibulares', 'Pueden producir dolor temporal o facial relacionado con masticación, bruxismo, sensibilidad local o alteraciones de la articulación temporomandibular.'],
        ['Patología dental', 'Infecciones o trastornos odontológicos pueden causar dolor facial o cefalea referida y deben buscarse cuando la localización y los síntomas acompañantes lo sugieren.'],
        ['Cefalea postpunción dural', 'Típicamente aparece después de una punción dural y presenta un componente postural marcado, empeorando al incorporarse y mejorando en decúbito.'],
        ['Abstinencia de cafeína', 'La reducción brusca del consumo habitual de cafeína puede provocar cefalea acompañada de fatiga, somnolencia o dificultad para concentrarse.'],
        ['Hipercapnia', 'La elevación del dióxido de carbono puede producir cefalea por vasodilatación cerebral, especialmente en pacientes con hipoventilación o insuficiencia respiratoria.'],
        ['Hipoxia', 'La disminución de la disponibilidad de oxígeno puede provocar cefalea y otros síntomas neurológicos, especialmente en enfermedad respiratoria, exposición a altura u otras situaciones de hipoxemia.'],
        ['Hipoglucemia', 'Puede causar cefalea, síntomas autonómicos, alteración cognitiva y déficits neurológicos que pueden simular enfermedad cerebral primaria.'],
        ['Crisis hipertensiva', 'La hipertensión severa asociada a daño agudo de órgano blanco puede producir cefalea y síntomas neurológicos. Una presión elevada aislada durante el dolor no demuestra que la hipertensión sea la causa de la cefalea.'],
        ['Dolor referido cervical', 'Patología musculoesquelética cervical puede generar dolor referido hacia región occipital, temporal o frontal.'],
        ['Herpes zóster', 'Puede producir dolor neuropático craneofacial antes o durante la aparición de lesiones vesiculares, incluido compromiso oftálmico cuando afecta la primera rama del trigémino.'],
        ['Feocromocitoma u otros síndromes catecolaminérgicos', 'Pueden producir episodios de cefalea asociados a hipertensión, palpitaciones, sudoración y otros síntomas adrenérgicos.'],
        ['Enfermedades inflamatorias o autoinmunes', 'Vasculitis y otras enfermedades inflamatorias sistémicas pueden manifestarse con cefalea, síntomas constitucionales o complicaciones neurológicas y vasculares.']
      ])
    },
    complementaryStudies: studies([
      ['Tomografía de cerebro sin contraste', 'Ante sospecha de hemorragia intracraneal, cefalea súbita, déficit neurológico, alteración del sensorio, trauma o determinados signos de alarma.', 'Hemorragia, efecto de masa, hidrocefalia y otras alteraciones estructurales evidentes.', 'Es especialmente útil en la evaluación inicial de hemorragia intracraneal. Una TC normal no excluye todas las causas graves de cefalea.'],
      ['Angio-TC cerebral y cervical', 'Ante sospecha de aneurisma, hemorragia subaracnoidea, disección, vasculopatía o síndrome de vasoconstricción cerebral reversible.', 'Aneurismas, disecciones, vasoconstricción y otras alteraciones vasculares.', 'Debe solicitarse de forma dirigida según la hipótesis clínica.'],
      ['Resonancia magnética cerebral', 'Ante sospecha de lesión estructural, trombosis venosa, enfermedad de fosa posterior, inflamación, infección o cefalea secundaria no aclarada por TC.', 'Lesiones estructurales, inflamatorias, vasculares y otras causas intracraneales.', 'Tiene mayor sensibilidad que la TC para numerosas patologías, aunque no siempre es el estudio inicial en urgencias.'],
      ['Venografía por TC o RM', 'Ante sospecha de trombosis venosa cerebral.', 'Defectos de llenado o ausencia de flujo en senos venosos cerebrales.', 'Es necesaria cuando la probabilidad clínica de trombosis venosa es relevante.'],
      ['Punción lumbar', 'Ante sospecha de meningitis, encefalitis, hemorragia subaracnoidea no aclarada por la estrategia de imagen o determinadas alteraciones de presión del LCR.', 'Presión de apertura, células, proteínas, glucosa, sangre, microbiología y otros análisis según hipótesis.', 'Debe valorar previamente si existen signos que indiquen necesidad de neuroimagen antes del procedimiento.'],
      ['Hemograma', 'Ante sospecha de infección, inflamación, anemia o enfermedad sistémica.', 'Leucocitosis, leucopenia, anemia y alteraciones plaquetarias.', 'Debe integrarse con el resto de la evaluación; un hemograma normal no excluye causas secundarias.'],
      ['PCR y/o VSG', 'Especialmente ante sospecha de arteritis de células gigantes u otra enfermedad inflamatoria.', 'Marcadores de inflamación sistémica.', 'Valores elevados apoyan el diagnóstico, pero deben interpretarse en contexto y no retrasar tratamiento cuando la sospecha es alta.'],
      ['Función renal e ionograma', 'Ante enfermedad sistémica, hipertensión severa, vómitos, deshidratación o planificación de estudios con contraste.', 'Alteraciones metabólicas y función renal.', 'Puede identificar factores contribuyentes y ayudar a planificar estudios y tratamiento.'],
      ['Glucemia', 'Ante alteración del sensorio, síntomas autonómicos, diabetes o cuadro neurológico.', 'Hipoglucemia o hiperglucemia significativa.', 'La hipoglucemia puede simular o agravar síntomas neurológicos.'],
      ['Beta-hCG', 'Cuando exista posibilidad de embarazo y pueda modificar diagnóstico diferencial o elección de estudios.', 'Confirmar embarazo.', 'Es especialmente relevante ante sospecha de preeclampsia, trombosis venosa u otras causas asociadas al embarazo.'],
      ['Cooximetría / carboxihemoglobina', 'Ante sospecha de exposición a monóxido de carbono.', 'Elevación de carboxihemoglobina.', 'La pulsioximetría convencional puede ser engañosamente normal.'],
      ['Evaluación oftalmológica / presión intraocular', 'Ante dolor ocular, ojo rojo, disminución visual o sospecha de glaucoma.', 'Hipertensión ocular y signos compatibles con glaucoma agudo u otra patología oftalmológica.', 'Permite identificar una emergencia oftalmológica que puede presentarse como cefalea intensa.'],
      ['Fondo de ojo', 'Ante sospecha de hipertensión endocraneana o alteraciones visuales.', 'Papiledema y otros hallazgos retinianos.', 'El papiledema obliga a considerar aumento de presión intracraneana y modifica la secuencia de estudios.']
    ]),
    initialTreatment: richText(
      { kind: 'paragraph', text: 'El tratamiento depende de la etiología y debe priorizar primero las causas secundarias graves.' },
      { kind: 'heading', text: 'Medidas generales' }, { kind: 'bullet', items: ['ambiente tranquilo cuando corresponda', 'analgesia', 'antieméticos', 'hidratación si existe déficit', 'corrección de glucemia o alteraciones metabólicas', 'tratamiento específico de la causa'] },
      { kind: 'heading', text: 'Cefalea primaria' }, { kind: 'paragraph', text: 'En migraña puede utilizarse tratamiento analgésico y antiemético según gravedad, antecedentes, contraindicaciones y respuesta previa.' }, { kind: 'paragraph', text: 'Evitar el uso rutinario de opioides como tratamiento de primera línea de migraña.' },
      { kind: 'heading', text: 'Hemorragia o causa vascular' }, { kind: 'paragraph', text: 'Requiere manejo específico, control fisiológico y evaluación neurológica/neuroquirúrgica urgente según el diagnóstico.' },
      { kind: 'heading', text: 'Meningitis bacteriana' }, { kind: 'paragraph', text: 'Ante alta sospecha clínica, no retrasar el tratamiento antimicrobiano adecuado por estudios que puedan demorarlo.' },
      { kind: 'heading', text: 'Arteritis de células gigantes' }, { kind: 'paragraph', text: 'Ante alta sospecha, el tratamiento no debe retrasarse esperando confirmación definitiva cuando existe riesgo de pérdida visual.' },
      { kind: 'heading', text: 'Glaucoma agudo' }, { kind: 'paragraph', text: 'Requiere tratamiento oftalmológico urgente.' },
      { kind: 'heading', text: 'Preeclampsia/eclampsia' }, { kind: 'paragraph', text: 'Requiere tratamiento obstétrico urgente, control de hipertensión cuando corresponda y prevención/tratamiento de convulsiones según protocolo.' }
    ),
    reassessment: richText(
      { kind: 'paragraph', text: 'Reevaluar:' }, { kind: 'bullet', items: ['intensidad del dolor', 'evolución temporal', 'signos vitales', 'estado mental', 'aparición de déficit neurológico', 'vómitos', 'síntomas visuales', 'respuesta al tratamiento', 'resultados de estudios'] },
      { kind: 'paragraph', text: 'Una cefalea que no responde al tratamiento habitual, cambia de características o desarrolla nuevos signos de alarma debe reevaluarse como posible cefalea secundaria.' },
      { kind: 'paragraph', text: 'La mejoría del dolor no excluye por sí sola una causa grave.' }
    ),
    disposition: {
      discharge: richText({ kind: 'paragraph', text: 'Considerar alta cuando:' }, { kind: 'bullet', items: ['paciente estable', 'examen neurológico tranquilizador', 'ausencia de signos de alarma relevantes', 'causa secundaria grave razonablemente excluida cuando correspondía', 'buena respuesta al tratamiento', 'patrón compatible con cefalea primaria o causa benigna', 'seguimiento disponible', 'comprende pautas de alarma'] }),
      admission: richText({ kind: 'paragraph', text: 'Considerar internación ante:' }, { kind: 'bullet', items: ['diagnóstico que requiere tratamiento hospitalario', 'cefalea persistente con incertidumbre relevante', 'necesidad de estudios seriados', 'infección', 'trombosis venosa cerebral', 'complicaciones vasculares', 'alteraciones neurológicas', 'mala respuesta al tratamiento', 'comorbilidad importante'] }),
      criticalCare: richText({ kind: 'paragraph', text: 'Considerar ante:' }, { kind: 'bullet', items: ['deterioro del sensorio', 'hemorragia intracraneal grave', 'hipertensión endocraneana', 'meningitis con falla orgánica', 'convulsiones persistentes', 'eclampsia', 'compromiso hemodinámico', 'necesidad de manejo avanzado de vía aérea', 'deterioro neurológico rápido'] }),
      referral: richText({ kind: 'paragraph', text: 'Según etiología considerar:' }, { kind: 'bullet', items: ['Neurología.', 'Neurocirugía.', 'Oftalmología.', 'Infectología.', 'Obstetricia.', 'Terapia intensiva.', 'Reumatología.', 'Centro de mayor complejidad.'] })
    },
    warningsAndInstructions: richText({ kind: 'paragraph', text: 'Indicar nueva evaluación urgente ante:' }, { kind: 'bullet', items: ['cefalea súbita o explosiva', 'empeoramiento progresivo', 'nueva focalidad neurológica', 'confusión o somnolencia', 'convulsiones', 'fiebre persistente', 'rigidez cervical', 'pérdida visual', 'diplopía nueva', 'vómitos persistentes', 'síncope', 'dolor luego de trauma relevante', 'nueva cefalea durante embarazo o puerperio', 'cefalea diferente a episodios habituales', 'empeoramiento general'] }),
    commonErrors: richText({ kind: 'bullet', items: ['Diagnosticar migraña únicamente porque el paciente tiene antecedentes de migraña.', 'Considerar benigna una cefalea porque mejora con analgésicos.', 'No preguntar cuánto tardó en alcanzar máxima intensidad.', 'No investigar una cefalea nueva o diferente del patrón habitual.', 'Descartar meningitis por ausencia de rigidez de nuca.', 'Descartar hemorragia subaracnoidea por examen neurológico normal.', 'No considerar trombosis venosa cerebral en embarazo o puerperio.', 'No considerar arteritis de células gigantes en mayores de 50 años.', 'No examinar el ojo ante cefalea asociada a dolor ocular o síntomas visuales.', 'No investigar monóxido de carbono cuando varios convivientes presentan cefalea.', 'Interpretar toda cefalea con hipertensión como causada por la presión arterial.', 'Solicitar neuroimagen indiscriminadamente en cefaleas primarias típicas sin signos de alarma.', 'No reevaluar cuando aparece un nuevo síntoma neurológico.', 'Utilizar opioides como tratamiento rutinario de migraña.', 'No reconocer cefalea por sobreuso de medicamentos.'] }),
    clinicalPearls: richText({ kind: 'bullet', items: ['La pregunta “¿cuánto tardó en alcanzar máxima intensidad?” es más útil que preguntar solamente si el dolor fue intenso.', 'Una cefalea de comienzo explosivo obliga a descartar hemorragia subaracnoidea y otras causas vasculares mediante una evaluación adecuada.', 'Un examen neurológico normal no excluye todas las cefaleas secundarias graves.', 'La mejoría con tratamiento no demuestra benignidad.', 'Cefalea nueva después de los 50 años obliga a ampliar el diagnóstico diferencial.', 'Embarazo y puerperio modifican significativamente el riesgo vascular.', 'Migraña puede producir síntomas neurológicos, pero déficits nuevos o atípicos requieren evaluación cuidadosa.', 'Papiledema es un hallazgo que obliga a evaluar hipertensión endocraneana.', 'Cefalea más fiebre y alteración mental debe hacer pensar en infección del sistema nervioso central.', 'Antes de etiquetar una cefalea como ansiedad o tensional, verificar que no existan signos de alarma.'] })
  };
}

const headacheDecisionTree: DecisionTree = {
  rootNodeId: 'headache-start',
  nodes: [
    { id: 'headache-start', type: 'start', title: 'Paciente con cefalea', description: 'Evaluar estabilidad, velocidad de instauración, examen neurológico y presencia de signos de alarma.' },
    { id: 'headache-unstable', type: 'question', title: '¿Existe deterioro neurológico, inestabilidad, convulsiones o compromiso grave?', description: 'Buscar alteración del sensorio, focalidad, convulsiones, hipertensión endocraneana o deterioro sistémico.' },
    { id: 'headache-stabilize', type: 'warning', title: 'Estabilización y evaluación neurológica urgente', description: 'Priorizar ABC, glucemia, control fisiológico, neuroimagen y tratamiento específico según la sospecha.' },
    { id: 'headache-thunderclap', type: 'question', title: '¿La cefalea alcanzó máxima intensidad en segundos o pocos minutos?', description: 'Una cefalea en trueno obliga a considerar hemorragia subaracnoidea y otras causas vasculares.' },
    { id: 'headache-sah-eval', type: 'warning', title: 'Evaluar hemorragia subaracnoidea y causas vasculares', description: 'Aplicar la estrategia diagnóstica apropiada con TC, estudios vasculares y/o punción lumbar según contexto.' },
    { id: 'headache-infection', type: 'question', title: '¿Hay fiebre, meningismo, alteración mental o sospecha de infección del SNC?', description: 'Considerar meningitis, encefalitis o absceso cerebral.' },
    { id: 'headache-infection-action', type: 'warning', title: 'Evaluación y tratamiento urgente de infección del SNC', description: 'Realizar estudios indicados sin retrasar tratamiento antimicrobiano cuando la sospecha sea alta.' },
    { id: 'headache-focal', type: 'question', title: '¿Existe déficit neurológico focal, convulsión nueva o papiledema?', description: 'Sugiere enfermedad vascular, lesión estructural, hipertensión endocraneana o trombosis venosa.' },
    { id: 'headache-neuroimaging', type: 'action', title: 'Neuroimagen dirigida', description: 'Seleccionar TC, angio-TC, RM o venografía según la sospecha clínica.' },
    { id: 'headache-pregnancy', type: 'question', title: '¿Está embarazada o en puerperio?', description: 'Considerar preeclampsia/eclampsia, trombosis venosa cerebral y otras causas vasculares específicas.' },
    { id: 'headache-obstetric', type: 'action', title: 'Evaluación obstétrica y neurológica dirigida', description: 'Controlar presión arterial, signos de preeclampsia y causas neurológicas asociadas al embarazo/puerperio.' },
    { id: 'headache-age50', type: 'question', title: '¿Es una cefalea nueva en paciente mayor de 50 años?', description: 'Aumenta la probabilidad de arteritis de células gigantes, neoplasia y otras causas secundarias.' },
    { id: 'headache-gca', type: 'question', title: '¿Hay síntomas compatibles con arteritis de células gigantes?', description: 'Buscar dolor temporal, claudicación mandibular, síntomas constitucionales y alteraciones visuales.' },
    { id: 'headache-gca-action', type: 'warning', title: 'Tratar y estudiar posible arteritis de células gigantes', description: 'Solicitar marcadores inflamatorios y evaluación especializada sin retrasar tratamiento cuando la sospecha sea alta.' },
    { id: 'headache-eye', type: 'question', title: '¿Hay dolor ocular intenso, ojo rojo o pérdida visual?', description: 'Considerar glaucoma agudo y otras emergencias oftalmológicas.' },
    { id: 'headache-eye-action', type: 'warning', title: 'Evaluación oftalmológica urgente', description: 'Medir presión intraocular y tratar según diagnóstico.' },
    { id: 'headache-secondary-redflags', type: 'question', title: '¿Existen otros signos de alarma de cefalea secundaria?', description: 'Considerar cáncer, inmunosupresión, trauma, anticoagulación, cefalea progresiva o cambio marcado del patrón.' },
    { id: 'headache-secondary-eval', type: 'action', title: 'Evaluación dirigida de cefalea secundaria', description: 'Seleccionar laboratorio, neuroimagen y otros estudios según el signo de alarma predominante.' },
    { id: 'headache-primary-pattern', type: 'question', title: '¿El patrón es compatible con una cefalea primaria conocida?', description: 'Valorar migraña, cefalea tensional o cefalea trigémino-autonómica tras excluir razonablemente signos de alarma.' },
    { id: 'headache-primary-treatment', type: 'action', title: 'Tratamiento de cefalea primaria', description: 'Administrar tratamiento sintomático apropiado según patrón clínico, antecedentes y contraindicaciones.' },
    { id: 'headache-reassess', type: 'action', title: 'Reevaluar dolor y examen neurológico', description: 'Confirmar respuesta, ausencia de nuevos signos de alarma y estabilidad clínica.' },
    { id: 'headache-serious', type: 'question', title: '¿Se confirmó o continúa siendo probable una causa secundaria grave?', description: 'Integrar clínica, evolución y resultados de estudios.' },
    { id: 'headache-specific', type: 'warning', title: 'Tratamiento específico e interconsulta', description: 'Iniciar manejo dirigido y definir neurología, neurocirugía, infectología, obstetricia u oftalmología según causa.' },
    { id: 'headache-safe-discharge', type: 'question', title: '¿Es seguro el manejo ambulatorio?', description: 'Debe existir estabilidad, examen tranquilizador, ausencia de alarmas relevantes y respuesta suficiente al tratamiento.' },
    { id: 'headache-critical', type: 'disposition', title: 'Cuidados críticos / intervención urgente', description: 'Indicado ante deterioro neurológico, hemorragia grave, hipertensión endocraneana, eclampsia, sepsis o necesidad de soporte avanzado.' },
    { id: 'headache-admit', type: 'disposition', title: 'Observación o internación', description: 'Indicado cuando existe causa secundaria, necesidad de estudios o tratamiento hospitalario, o incertidumbre clínica relevante.' },
    { id: 'headache-discharge', type: 'disposition', title: 'Alta con tratamiento, seguimiento y pautas de alarma', description: 'Apropiado cuando la cefalea grave secundaria ha sido razonablemente excluida y existe respuesta clínica suficiente.' }
  ],
  edges: [
    { id: 'hd-e01', from: 'headache-start', to: 'headache-unstable' },
    { id: 'hd-e02', from: 'headache-unstable', to: 'headache-stabilize', label: 'Sí' },
    { id: 'hd-e03', from: 'headache-unstable', to: 'headache-thunderclap', label: 'No' },
    { id: 'hd-e04', from: 'headache-stabilize', to: 'headache-critical' },
    { id: 'hd-e05', from: 'headache-thunderclap', to: 'headache-sah-eval', label: 'Sí' },
    { id: 'hd-e06', from: 'headache-thunderclap', to: 'headache-infection', label: 'No' },
    { id: 'hd-e07', from: 'headache-sah-eval', to: 'headache-serious' },
    { id: 'hd-e08', from: 'headache-infection', to: 'headache-infection-action', label: 'Sí' },
    { id: 'hd-e09', from: 'headache-infection', to: 'headache-focal', label: 'No' },
    { id: 'hd-e10', from: 'headache-infection-action', to: 'headache-specific' },
    { id: 'hd-e11', from: 'headache-focal', to: 'headache-neuroimaging', label: 'Sí' },
    { id: 'hd-e12', from: 'headache-focal', to: 'headache-pregnancy', label: 'No' },
    { id: 'hd-e13', from: 'headache-neuroimaging', to: 'headache-serious' },
    { id: 'hd-e14', from: 'headache-pregnancy', to: 'headache-obstetric', label: 'Sí' },
    { id: 'hd-e15', from: 'headache-pregnancy', to: 'headache-age50', label: 'No' },
    { id: 'hd-e16', from: 'headache-obstetric', to: 'headache-serious' },
    { id: 'hd-e17', from: 'headache-age50', to: 'headache-gca', label: 'Sí' },
    { id: 'hd-e18', from: 'headache-age50', to: 'headache-eye', label: 'No' },
    { id: 'hd-e19', from: 'headache-gca', to: 'headache-gca-action', label: 'Sí' },
    { id: 'hd-e20', from: 'headache-gca', to: 'headache-eye', label: 'No' },
    { id: 'hd-e21', from: 'headache-gca-action', to: 'headache-specific' },
    { id: 'hd-e22', from: 'headache-eye', to: 'headache-eye-action', label: 'Sí' },
    { id: 'hd-e23', from: 'headache-eye', to: 'headache-secondary-redflags', label: 'No' },
    { id: 'hd-e24', from: 'headache-eye-action', to: 'headache-specific' },
    { id: 'hd-e25', from: 'headache-secondary-redflags', to: 'headache-secondary-eval', label: 'Sí' },
    { id: 'hd-e26', from: 'headache-secondary-redflags', to: 'headache-primary-pattern', label: 'No' },
    { id: 'hd-e27', from: 'headache-secondary-eval', to: 'headache-serious' },
    { id: 'hd-e28', from: 'headache-primary-pattern', to: 'headache-primary-treatment', label: 'Sí' },
    { id: 'hd-e29', from: 'headache-primary-pattern', to: 'headache-secondary-eval', label: 'No / patrón atípico' },
    { id: 'hd-e30', from: 'headache-primary-treatment', to: 'headache-reassess' },
    { id: 'hd-e31', from: 'headache-reassess', to: 'headache-safe-discharge' },
    { id: 'hd-e32', from: 'headache-serious', to: 'headache-specific', label: 'Sí' },
    { id: 'hd-e33', from: 'headache-serious', to: 'headache-reassess', label: 'No' },
    { id: 'hd-e34', from: 'headache-specific', to: 'headache-critical', label: 'Crítico / deterioro' },
    { id: 'hd-e35', from: 'headache-specific', to: 'headache-admit', label: 'Estable pero requiere internación' },
    { id: 'hd-e36', from: 'headache-safe-discharge', to: 'headache-discharge', label: 'Sí' },
    { id: 'hd-e37', from: 'headache-safe-discharge', to: 'headache-admit', label: 'No' }
  ]
};

export function createHeadacheClinicalApproach(userId: string): ClinicalApproach {
  const timestamp = new Date().toISOString();
  const content: ClinicalApproachContent = {
    ...createHeadacheApproachBaseContent(),
    decisionTree: headacheDecisionTree,
    relatedContent: []
  };
  const validation = validateDecisionTree(content.decisionTree);
  if (validation.errors.length > 0) throw new Error(`El fixture de Cefalea contiene un árbol inválido: ${validation.errors.map((issue) => issue.message).join(' ')}`);
  return {
    id: crypto.randomUUID(),
    userId,
    title: HEADACHE_APPROACH_TITLE,
    description: HEADACHE_APPROACH_DESCRIPTION,
    categoryId: null,
    category: null,
    content,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'complete'
  };
}
