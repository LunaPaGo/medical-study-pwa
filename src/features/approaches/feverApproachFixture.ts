import type { TipTapDocument } from '../../types/topic';
import type { ClinicalApproach, ClinicalApproachContent, ComplementaryStudy, DecisionTree, DifferentialDiagnosisItem, ReasoningItem } from './clinicalApproachTypes';
import { validateDecisionTree } from './decisionTreeValidation';

type TextBlock = { kind: 'paragraph' | 'heading'; text: string } | { kind: 'bullet'; items: string[] };
type FeverApproachBaseContent = Pick<ClinicalApproachContent,
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

export const FEVER_APPROACH_TITLE = 'Fiebre';
export const FEVER_APPROACH_DESCRIPTION = 'Abordaje inicial del paciente con fiebre aguda o subaguda, orientado a evaluar estabilidad, reconocer sepsis y otras condiciones tiempo-dependientes, identificar el foco probable y los huéspedes de alto riesgo, seleccionar estudios y definir tratamiento, reevaluación y disposición.';

export function createFeverApproachBaseContent(): FeverApproachBaseContent {
  return {
    version: 1,
    presentation: richText(
      { kind: 'paragraph', text: 'La fiebre es una elevación regulada de la temperatura corporal mediada por un cambio del punto de ajuste hipotalámico. Es un motivo de consulta muy frecuente y puede corresponder a infecciones autolimitadas, infecciones bacterianas potencialmente graves, enfermedades inflamatorias, neoplasias, reacciones farmacológicas u otras causas no infecciosas.' },
      { kind: 'paragraph', text: 'La temperatura debe interpretarse junto con el contexto clínico. La magnitud de la fiebre por sí sola no permite determinar la gravedad ni diferenciar de forma fiable una etiología viral de una bacteriana.' },
      { kind: 'paragraph', text: 'El abordaje inicial debe responder de manera ordenada:' },
      { kind: 'bullet', items: ['¿El paciente está inestable o presenta disfunción orgánica?', '¿Existe sospecha de sepsis, shock séptico u otra infección tiempo-dependiente?', '¿Hay un foco clínico probable?', '¿Pertenece a un grupo de alto riesgo?', '¿Existen exposiciones, procedimientos, dispositivos o medicamentos relevantes?', '¿Los estudios complementarios modificarán la conducta?', '¿Necesita tratamiento antimicrobiano inmediato?', '¿Puede manejarse ambulatoriamente o requiere observación, internación, cuidados críticos o derivación?'] },
      { kind: 'paragraph', text: 'Debe diferenciarse fiebre de hipertermia. En la hipertermia no existe un aumento regulado del punto de ajuste hipotalámico y pueden existir causas como golpe de calor, síndromes inducidos por fármacos o hiperactividad muscular grave. Esta distinción modifica sustancialmente el tratamiento.' }
    ),
    initialAssessment: richText(
      { kind: 'paragraph', text: 'Confirmar y contextualizar la temperatura cuando sea posible, considerando método y sitio de medición.' },
      { kind: 'paragraph', text: 'Evaluar inicialmente:' },
      { kind: 'bullet', items: ['vía aérea', 'respiración', 'circulación', 'frecuencia cardíaca', 'presión arterial', 'frecuencia respiratoria', 'saturación de oxígeno', 'temperatura', 'estado mental', 'perfusión periférica', 'diuresis cuando sea relevante', 'glucemia en pacientes con alteración neurológica o contexto compatible'] },
      { kind: 'paragraph', text: 'Buscar inmediatamente signos de gravedad:' },
      { kind: 'bullet', items: ['hipotensión', 'alteración del estado mental', 'dificultad respiratoria', 'hipoxemia', 'signos de mala perfusión', 'oliguria', 'piel moteada o extremidades frías', 'deterioro clínico rápido', 'rigidez de nuca o signos neurológicos', 'petequias o púrpura', 'dolor intenso desproporcionado', 'sospecha de infección necrotizante', 'inmunosupresión significativa', 'neutropenia conocida o probable', 'embarazo con compromiso sistémico', 'presencia de dispositivos intravasculares u otros focos de infección profunda'] },
      { kind: 'paragraph', text: 'Ante sospecha de sepsis, evaluar de forma sistemática la presencia de infección asociada a disfunción orgánica. No debe utilizarse una única escala o un único parámetro para descartar sepsis.' },
      { kind: 'paragraph', text: 'En un paciente inestable, la reanimación, la búsqueda del foco y el tratamiento de la causa deben realizarse simultáneamente.' }
    ),
    lifeThreats: richText(
      { kind: 'paragraph', text: 'Las principales situaciones que deben reconocerse precozmente incluyen:' },
      { kind: 'bullet', items: ['sepsis con disfunción orgánica', 'shock séptico', 'meningitis bacteriana / meningoencefalitis', 'infección meningocócica invasiva', 'neutropenia febril', 'neumonía grave', 'pielonefritis complicada / urosepsis', 'colangitis aguda grave', 'infección intraabdominal complicada', 'infección necrotizante de piel y partes blandas', 'endocarditis infecciosa complicada', 'infección asociada a catéter o dispositivo con bacteriemia', 'síndrome de shock tóxico', 'hipertermia grave y síndromes hipermetabólicos que pueden confundirse con fiebre'] },
      { kind: 'heading', text: 'Sepsis y shock séptico' }, { kind: 'paragraph', text: 'Considerar sepsis cuando exista una infección sospechada o confirmada asociada a disfunción orgánica aguda. Hipotensión, alteración del sensorio, hipoxemia, oliguria, mala perfusión, lactato elevado u otras alteraciones orgánicas aumentan la preocupación.' }, { kind: 'paragraph', text: 'El shock séptico representa una forma particularmente grave de sepsis con alteraciones circulatorias y metabólicas persistentes y requiere reanimación y tratamiento urgente.' },
      { kind: 'heading', text: 'Meningitis bacteriana / meningoencefalitis' }, { kind: 'paragraph', text: 'Considerar ante fiebre asociada a cefalea intensa, rigidez cervical, alteración del sensorio, convulsiones, focalidad o exantema compatible. La presentación clásica puede ser incompleta.' },
      { kind: 'heading', text: 'Infección meningocócica invasiva' }, { kind: 'paragraph', text: 'Puede evolucionar rápidamente con fiebre, deterioro sistémico, petequias o púrpura, shock y coagulación intravascular diseminada. La ausencia inicial de exantema no la excluye.' },
      { kind: 'heading', text: 'Neutropenia febril' }, { kind: 'paragraph', text: 'Debe considerarse una emergencia infecciosa en pacientes con neutropenia conocida o probable, especialmente durante tratamiento oncológico o inmunosupresor. Los signos inflamatorios pueden ser mínimos y la ausencia de un foco evidente no implica bajo riesgo.' },
      { kind: 'heading', text: 'Neumonía grave' }, { kind: 'paragraph', text: 'Sospechar ante fiebre con disnea, hipoxemia, taquipnea, hipotensión, alteración mental o compromiso respiratorio significativo.' },
      { kind: 'heading', text: 'Pielonefritis complicada / urosepsis' }, { kind: 'paragraph', text: 'Puede presentarse con fiebre, dolor lumbar, síntomas urinarios o sepsis sin síntomas urinarios prominentes, especialmente en adultos mayores o pacientes vulnerables.' },
      { kind: 'heading', text: 'Colangitis aguda grave' }, { kind: 'paragraph', text: 'Considerar ante fiebre, dolor abdominal, ictericia y/o datos de obstrucción biliar, especialmente si existe hipotensión o alteración del sensorio.' },
      { kind: 'heading', text: 'Infección intraabdominal complicada' }, { kind: 'paragraph', text: 'Perforación, absceso, peritonitis, apendicitis complicada, diverticulitis complicada y otras infecciones abdominales pueden producir sepsis y requerir control urgente del foco.' },
      { kind: 'heading', text: 'Infección necrotizante de piel y partes blandas' }, { kind: 'paragraph', text: 'Debe sospecharse ante dolor desproporcionado, progresión rápida, edema, cambios de coloración, bullas, crepitación, anestesia cutánea o toxicidad sistémica. La ausencia de hallazgos cutáneos llamativos al inicio no la excluye.' },
      { kind: 'heading', text: 'Endocarditis infecciosa complicada' }, { kind: 'paragraph', text: 'Considerar especialmente ante fiebre persistente con prótesis valvular, cardiopatía predisponente, dispositivos intracardíacos, bacteriemia, fenómenos embólicos o consumo de drogas intravenosas.' },
      { kind: 'heading', text: 'Hipertermia grave' }, { kind: 'paragraph', text: 'Golpe de calor, síndrome serotoninérgico, síndrome neuroléptico maligno y otras causas de hipertermia pueden producir temperatura elevada y disfunción orgánica, pero su fisiopatología y tratamiento difieren de la fiebre infecciosa.' }
    ),
    anamnesis: reasoning(1, [
      ['Inicio y duración', 'Preguntar cuándo comenzó la fiebre, cuánto tiempo lleva de evolución y si fue medida objetivamente.', 'La duración y evolución ayudan a organizar el diagnóstico diferencial y distinguir cuadros agudos de procesos persistentes o recurrentes.'],
      ['Magnitud y método de medición', 'Registrar temperatura máxima conocida y cómo fue medida.', 'Permite interpretar mejor el dato térmico, aunque la magnitud de la fiebre aislada no define gravedad ni etiología.'],
      ['Patrón y evolución', 'Preguntar si la fiebre es continua, intermitente o recurrente y cómo ha evolucionado el estado general.', 'El patrón puede aportar contexto, pero el deterioro clínico y la disfunción orgánica son más importantes que la forma de la curva térmica.'],
      ['Escalofríos y rigores', 'Preguntar por escalofríos intensos o episodios de temblor generalizado asociados a ascensos térmicos.', 'Pueden acompañar bacteriemia u otras infecciones significativas, aunque no son específicos.'],
      ['Síntomas respiratorios', 'Preguntar por tos, expectoración, disnea, dolor torácico pleurítico, hemoptisis y síntomas de vía aérea superior.', 'Orienta hacia neumonía y otros focos respiratorios y permite reconocer compromiso respiratorio asociado.'],
      ['Síntomas urinarios', 'Preguntar por disuria, polaquiuria, urgencia, dolor lumbar, hematuria y cambios urinarios.', 'Orienta hacia infección urinaria o pielonefritis, aunque estos síntomas pueden faltar en pacientes vulnerables.'],
      ['Síntomas gastrointestinales y abdominales', 'Preguntar por dolor abdominal, náuseas, vómitos, diarrea, constipación, ictericia y cambios en las deposiciones.', 'Puede orientar hacia gastroenteritis, infección hepatobiliar, apendicitis, diverticulitis, absceso u otros focos intraabdominales.'],
      ['Síntomas neurológicos', 'Preguntar por cefalea, rigidez cervical, fotofobia, confusión, somnolencia, convulsiones o déficit focal.', 'Puede indicar meningitis, encefalitis, absceso cerebral u otra infección del sistema nervioso central.'],
      ['Piel y partes blandas', 'Preguntar por heridas, eritema, edema, dolor localizado, secreción, lesiones cutáneas, mordeduras, úlceras o procedimientos recientes.', 'Permite identificar celulitis, abscesos, infecciones de heridas o infecciones necrotizantes.'],
      ['Síntomas osteoarticulares', 'Preguntar por dolor articular, tumefacción, limitación funcional y dolor óseo o vertebral.', 'Puede orientar hacia artritis séptica, osteomielitis o espondilodiscitis.'],
      ['Síntomas odontológicos y otorrinolaringológicos', 'Preguntar por odontalgia, edema facial, odinofagia, dolor cervical, otalgia, secreción ótica o síntomas sinusales relevantes.', 'Los focos odontógenos y de cabeza y cuello pueden producir infecciones profundas y complicaciones graves.'],
      ['Dispositivos y procedimientos recientes', 'Preguntar por catéteres vasculares, sondas, prótesis, marcapasos, material ortopédico, cirugías, procedimientos invasivos y hospitalizaciones recientes.', 'Aumentan el riesgo de infecciones asociadas a dispositivos, bacteriemia y microorganismos resistentes.'],
      ['Antibióticos recientes', 'Preguntar por antibióticos utilizados recientemente, indicación, duración y respuesta.', 'Puede modificar la presentación, los cultivos, el espectro microbiológico esperado y el riesgo de resistencia.'],
      ['Inmunosupresión', 'Preguntar por cáncer, quimioterapia, trasplante, VIH, corticoides, inmunomoduladores, asplenia u otras causas de inmunocompromiso.', 'Los pacientes inmunocomprometidos pueden presentar infecciones graves con signos clínicos mínimos y requieren un umbral diagnóstico y terapéutico diferente.'],
      ['Neutropenia conocida o riesgo de neutropenia', 'Preguntar por quimioterapia reciente, enfermedades hematológicas o antecedentes de neutropenia.', 'La fiebre en un paciente neutropénico constituye una situación de alto riesgo que requiere evaluación y tratamiento rápidos.'],
      ['Embarazo y puerperio', 'Preguntar por embarazo actual, edad gestacional, puerperio reciente y síntomas obstétricos.', 'Modifica el diagnóstico diferencial, la selección de estudios y antimicrobianos y obliga a considerar infecciones obstétricas y sepsis materna.'],
      ['Viajes y exposiciones epidemiológicas', 'Preguntar por viajes recientes, área geográfica, agua o alimentos de riesgo, exposición a animales, insectos, personas enfermas y brotes conocidos.', 'Puede ampliar el diagnóstico diferencial hacia infecciones específicas según exposición y epidemiología.'],
      ['Exposición ocupacional y ambiental', 'Preguntar por trabajo sanitario, contacto con animales, actividades rurales, aguas recreativas, suelo, cuevas u otras exposiciones relevantes.', 'Algunas infecciones requieren antecedentes epidemiológicos específicos para ser sospechadas.'],
      ['Medicamentos y drogas', 'Revisar medicamentos nuevos, cambios recientes, sustancias recreativas y fármacos capaces de producir fiebre o hipertermia.', 'Permite considerar fiebre medicamentosa, síndrome serotoninérgico, síndrome neuroléptico maligno y otras causas no infecciosas.'],
      ['Antecedentes y episodios previos', 'Preguntar por infecciones previas, enfermedades autoinmunes, neoplasias, endocarditis, tuberculosis, cirugías y episodios similares.', 'Los antecedentes modifican la probabilidad pretest y pueden orientar hacia recurrencia, reactivación o causas no infecciosas.']
    ]),
    physicalExam: reasoning(2, [
      ['Signos vitales y estado general', 'Evaluar temperatura, presión arterial, frecuencia cardíaca, frecuencia respiratoria, saturación de oxígeno y aspecto general.', 'Permite reconocer precozmente compromiso sistémico, respiratorio o circulatorio.'],
      ['Estado mental', 'Evaluar nivel de conciencia, orientación, atención y conducta.', 'La alteración aguda del sensorio puede representar disfunción orgánica por sepsis, infección del sistema nervioso central, trastorno metabólico o hipertermia.'],
      ['Perfusión periférica', 'Evaluar relleno capilar, temperatura de extremidades, coloración cutánea, pulsos y signos de hipoperfusión.', 'Ayuda a reconocer compromiso circulatorio y shock.'],
      ['Examen respiratorio', 'Evaluar trabajo respiratorio, expansión torácica, auscultación y signos de consolidación, derrame u obstrucción.', 'Permite identificar un foco respiratorio y valorar gravedad.'],
      ['Examen cardiovascular', 'Evaluar frecuencia y ritmo, ruidos cardíacos, nuevos soplos y signos de insuficiencia cardíaca.', 'Puede aportar datos de endocarditis, compromiso hemodinámico o complicaciones cardiovasculares.'],
      ['Examen abdominal', 'Evaluar dolor localizado, defensa, signos peritoneales, masas, hepatomegalia e ictericia.', 'Puede identificar infección intraabdominal, hepatobiliar o necesidad de control urgente del foco.'],
      ['Puñopercusión lumbar y aparato urinario', 'Buscar dolor en ángulo costovertebral y otros hallazgos compatibles con foco urinario.', 'Puede apoyar pielonefritis, aunque su ausencia no la excluye.'],
      ['Piel y partes blandas', 'Examinar completamente cuando sea necesario en busca de eritema, heridas, abscesos, úlceras, bullas, necrosis, crepitación o lesiones ocultas.', 'Los focos cutáneos pueden ser sutiles y una infección necrotizante puede progresar rápidamente.'],
      ['Examen neurológico y signos meníngeos', 'Evaluar estado neurológico, focalidad, rigidez cervical y otros signos de irritación meníngea según contexto.', 'Permite reconocer infección del sistema nervioso central y otras complicaciones neurológicas.'],
      ['Articulaciones y sistema musculoesquelético', 'Buscar articulaciones dolorosas, calientes, tumefactas o con limitación marcada y evaluar dolor óseo o vertebral focal.', 'Puede orientar hacia artritis séptica, osteomielitis o espondilodiscitis.'],
      ['Cabeza, cuello, cavidad oral y oídos', 'Examinar faringe, dentición, cavidad oral, cuello y oídos según síntomas.', 'Puede revelar focos odontógenos, periamigdalinos, cervicales profundos, óticos o mastoideos.'],
      ['Dispositivos, accesos y heridas quirúrgicas', 'Inspeccionar catéteres, accesos vasculares, sondas, ostomías y heridas operatorias.', 'Los dispositivos y heridas son fuentes potenciales de infección y bacteriemia.'],
      ['Petequias, púrpura y otros exantemas', 'Buscar lesiones petequiales, purpúricas, vesiculares, maculopapulares u otros patrones cutáneos.', 'Determinados exantemas pueden orientar hacia infección invasiva, enfermedad viral, reacción farmacológica o enfermedad sistémica.'],
      ['Evaluación obstétrica contextual', 'En embarazo o puerperio, buscar dolor uterino, secreciones, sangrado, signos de infección de herida y otros hallazgos obstétricos según contexto.', 'Permite reconocer focos obstétricos de sepsis y modifica la conducta diagnóstica y terapéutica.']
    ]),
    differentialDiagnosis: {
      lifeThreatening: differentials(3, [
        ['Sepsis con disfunción orgánica', 'Debe considerarse ante infección sospechada o confirmada asociada a alteración aguda del estado mental, hipotensión, hipoxemia, oliguria, hipoperfusión u otra disfunción orgánica.'],
        ['Shock séptico', 'Forma grave de sepsis con compromiso circulatorio y metabólico persistente que requiere reanimación y tratamiento urgente.'],
        ['Meningitis bacteriana / meningoencefalitis', 'Fiebre asociada a cefalea intensa, rigidez cervical, alteración del sensorio, convulsiones o focalidad requiere evaluación y tratamiento rápidos.'],
        ['Infección meningocócica invasiva', 'Puede evolucionar rápidamente con sepsis, púrpura, coagulación intravascular diseminada y shock. La ausencia inicial de exantema no la excluye.'],
        ['Neutropenia febril', 'Emergencia infecciosa en pacientes neutropénicos, en quienes los signos inflamatorios pueden ser mínimos y la ausencia de foco no implica bajo riesgo.'],
        ['Neumonía grave', 'Fiebre con hipoxemia, taquipnea, dificultad respiratoria, hipotensión o alteración mental puede corresponder a neumonía grave y requerir soporte e internación.'],
        ['Pielonefritis complicada / urosepsis', 'Puede producir bacteriemia, disfunción orgánica y shock, especialmente ante obstrucción urinaria, instrumentación o huéspedes vulnerables.'],
        ['Colangitis aguda grave', 'La infección biliar asociada a obstrucción puede progresar a sepsis y requiere antibióticos y control del foco.'],
        ['Infección intraabdominal complicada', 'Perforación, peritonitis, absceso u otras infecciones abdominales pueden requerir antibióticos y control quirúrgico o intervencionista urgente.'],
        ['Infección necrotizante de piel y partes blandas', 'El dolor desproporcionado, la progresión rápida y la toxicidad sistémica obligan a considerar una infección necrotizante, aun con hallazgos cutáneos iniciales discretos.'],
        ['Endocarditis infecciosa complicada', 'Puede producir sepsis, insuficiencia cardíaca, embolias y complicaciones neurológicas, especialmente en pacientes con prótesis, dispositivos o bacteriemia persistente.'],
        ['Infección asociada a catéter o dispositivo con bacteriemia', 'Los accesos vasculares y dispositivos implantados pueden actuar como foco de bacteriemia y sepsis.'],
        ['Síndrome de shock tóxico', 'Puede presentarse con fiebre alta, hipotensión, exantema y disfunción multiorgánica, asociado a toxinas bacterianas.'],
        ['Hipertermia grave', 'Golpe de calor, síndrome serotoninérgico y síndrome neuroléptico maligno pueden simular una infección grave pero requieren estrategias terapéuticas específicas.']
      ]),
      common: differentials(4, [
        ['Infección viral de vías respiratorias', 'Causa frecuente de fiebre aguda asociada a rinorrea, odinofagia, tos, mialgias y otros síntomas respiratorios altos.'],
        ['Influenza u otra infección viral sistémica', 'Puede producir fiebre de inicio agudo, mialgias, cefalea, astenia y síntomas respiratorios.'],
        ['COVID-19 u otra infección respiratoria viral relevante según epidemiología', 'Debe considerarse de acuerdo con circulación epidemiológica, exposición y presentación clínica.'],
        ['Faringoamigdalitis', 'Puede causar fiebre, odinofagia, adenopatías y hallazgos faríngeos; la etiología puede ser viral o bacteriana.'],
        ['Otitis media aguda', 'Puede presentar fiebre asociada a otalgia y hallazgos otoscópicos compatibles.'],
        ['Neumonía no grave', 'Puede manifestarse con fiebre, tos, expectoración y dolor pleurítico sin criterios iniciales de gravedad.'],
        ['Infección urinaria', 'Puede producir fiebre con síntomas urinarios o presentaciones menos específicas en determinados pacientes.'],
        ['Gastroenteritis infecciosa', 'Fiebre asociada a diarrea, vómitos y dolor abdominal suele corresponder a una infección gastrointestinal, aunque deben identificarse signos de deshidratación o enfermedad invasiva.'],
        ['Celulitis', 'Fiebre con eritema, calor, dolor y edema local puede corresponder a infección de piel y tejidos blandos.'],
        ['Absceso cutáneo', 'Colección purulenta localizada que puede producir fiebre y suele requerir evaluación de drenaje además del tratamiento antimicrobiano cuando corresponda.'],
        ['Sinusitis bacteriana aguda', 'Debe considerarse cuando existe un patrón clínico compatible, especialmente síntomas persistentes, empeoramiento tras mejoría inicial o presentación severa.'],
        ['Infección odontógena', 'Puede producir fiebre, odontalgia, edema facial y, en casos complicados, extensión a espacios profundos del cuello.']
      ]),
      contextual: differentials(5, [
        ['Endocarditis infecciosa no complicada', 'Puede producir fiebre prolongada, soplo, fenómenos embólicos o bacteriemia, incluso sin shock inicial.'],
        ['Osteomielitis', 'Puede causar fiebre con dolor óseo focal, especialmente en pacientes con heridas, prótesis o bacteriemia.'],
        ['Artritis séptica', 'Debe considerarse ante fiebre con articulación caliente, dolorosa y con limitación marcada del movimiento.'],
        ['Espondilodiscitis', 'Puede presentarse con fiebre y dolor vertebral focal, especialmente ante bacteriemia o factores predisponentes.'],
        ['Tuberculosis', 'Puede causar fiebre persistente o vespertina, sudoración nocturna, pérdida de peso y compromiso pulmonar o extrapulmonar.'],
        ['Infección por VIH aguda u oportunista', 'Según contexto epidemiológico e inmunológico, puede producir fiebre aguda o persistente con manifestaciones variables.'],
        ['Infecciones transmitidas por vectores', 'Dengue, malaria y otras enfermedades deben considerarse según viaje, exposición y epidemiología local.'],
        ['Zoonosis', 'Brucelosis, leptospirosis y otras zoonosis dependen de exposición animal, ocupacional y geográfica.'],
        ['Infecciones asociadas a viajes', 'El destino, duración, alimentos, agua, picaduras y profilaxis modifican el diagnóstico diferencial.'],
        ['Infección por Clostridioides difficile', 'Considerar ante diarrea y fiebre, especialmente después de antibióticos o internación reciente.'],
        ['Infección de prótesis articular', 'Puede presentar fiebre, dolor y disfunción de la articulación protésica, a veces de forma subaguda.'],
        ['Infección de herida quirúrgica', 'Puede aparecer tras cirugía con dolor, eritema, secreción, dehiscencia o fiebre sin foco alternativo.'],
        ['Infección obstétrica o puerperal', 'Endometritis, infección de cesárea, mastitis y otras infecciones deben considerarse durante embarazo o puerperio.'],
        ['Fiebre medicamentosa', 'Puede aparecer tras la introducción de determinados medicamentos y debe sospecharse cuando no se identifica un foco infeccioso y la cronología es compatible.'],
        ['Enfermedad autoinmune o inflamatoria', 'Vasculitis, lupus, artritis inflamatorias y otras enfermedades pueden producir fiebre sistémica.'],
        ['Enfermedad de Still del adulto', 'Puede producir fiebre elevada recurrente, artralgias, rash evanescente y marcadores inflamatorios elevados.'],
        ['Neoplasia', 'Linfomas, leucemias y determinados tumores sólidos pueden manifestarse con fiebre persistente.'],
        ['Trombosis venosa / tromboembolismo pulmonar', 'Los eventos tromboembólicos pueden acompañarse de febrícula o fiebre y deben considerarse cuando el contexto clínico lo sugiera.'],
        ['Tiroiditis', 'La tiroiditis subaguda puede causar fiebre, dolor cervical anterior y síntomas tiroideos.'],
        ['Pancreatitis', 'Puede acompañarse de fiebre como respuesta inflamatoria o indicar una complicación infecciosa según contexto.'],
        ['Fiebre posoperatoria', 'Debe interpretarse según el tiempo desde la cirugía y buscar causas infecciosas y no infecciosas sin asumir automáticamente una etiología bacteriana.'],
        ['Reacción transfusional', 'Fiebre durante o después de una transfusión obliga a evaluar reacciones febriles, hemólisis, contaminación bacteriana y otras complicaciones.']
      ])
    },
    complementaryStudies: studies([
      ['Hemograma con fórmula leucocitaria', 'Ante sospecha de infección significativa, sepsis, inmunosupresión, neutropenia o cuadro sin foco claro.', 'Leucocitosis, leucopenia, neutropenia, anemia y alteraciones plaquetarias.', 'Debe interpretarse en contexto. Un recuento leucocitario normal no excluye infección grave.'],
      ['Función renal e ionograma', 'En pacientes con compromiso sistémico, deshidratación, sepsis, vómitos, comorbilidad o necesidad de fármacos potencialmente nefrotóxicos.', 'Insuficiencia renal, alteraciones hidroelectrolíticas y datos de disfunción orgánica.', 'Ayuda a valorar gravedad y ajustar tratamiento.'],
      ['Hepatograma', 'Ante sepsis, ictericia, dolor abdominal, sospecha hepatobiliar o compromiso sistémico.', 'Citólisis, colestasis, hiperbilirrubinemia y otros datos de disfunción hepática.', 'Puede orientar hacia foco hepatobiliar o disfunción orgánica.'],
      ['Lactato', 'Ante sospecha de sepsis, shock o hipoperfusión.', 'Elevación compatible con alteración metabólica y/o hipoperfusión.', 'Un valor elevado aumenta la preocupación por gravedad, pero debe interpretarse junto con el cuadro clínico y su evolución.'],
      ['Proteína C reactiva', 'Cuando un marcador inflamatorio pueda aportar al seguimiento o evaluación de determinadas infecciones.', 'Inflamación sistémica.', 'Es inespecífica y no debe utilizarse aisladamente para decidir etiología bacteriana o gravedad.'],
      ['Procalcitonina', 'En contextos seleccionados donde pueda colaborar con decisiones antimicrobianas o seguimiento.', 'Marcador asociado a determinadas infecciones bacterianas sistémicas.', 'No debe utilizarse de forma aislada para descartar infección grave ni retrasar antibióticos cuando están indicados.'],
      ['Hemocultivos', 'Ante sepsis, shock, sospecha de bacteriemia, endocarditis, infección grave, neutropenia febril o cuando el resultado pueda modificar el tratamiento.', 'Bacteriemia o fungemia y susceptibilidad antimicrobiana.', 'Idealmente obtener antes de los antibióticos cuando esto no retrasa un tratamiento urgente.'],
      ['Uroanálisis y urocultivo', 'Ante sospecha de infección urinaria, sepsis sin foco, embarazo, determinados pacientes vulnerables o cuadros compatibles.', 'Piuria, bacteriuria y aislamiento microbiológico.', 'La bacteriuria asintomática no equivale automáticamente a foco urinario, salvo situaciones específicas.'],
      ['Radiografía de tórax', 'Ante síntomas respiratorios, hipoxemia, hallazgos auscultatorios o sepsis sin foco evidente cuando el contexto lo justifique.', 'Infiltrados, consolidación, derrame u otras alteraciones torácicas.', 'Una radiografía inicial normal no excluye completamente neumonía en fases tempranas o determinados pacientes.'],
      ['Ecografía clínica / POCUS', 'Como extensión del examen en pacientes seleccionados con sospecha pulmonar, urinaria, hepatobiliar, abdominal o de foco profundo.', 'Consolidación, derrame, hidronefrosis, alteraciones biliares, líquido libre u otros hallazgos según el protocolo utilizado.', 'Complementa pero no sustituye estudios definitivos cuando la probabilidad clínica sigue siendo relevante.'],
      ['Ecografía abdominal dirigida', 'Ante sospecha hepatobiliar, urinaria, colecciones o determinados focos abdominales.', 'Obstrucción biliar, colecistitis, hidronefrosis, colecciones u otros hallazgos.', 'Particularmente útil cuando se sospecha una causa que requiere control del foco.'],
      ['Tomografía computada dirigida', 'Ante sospecha de infección profunda, intraabdominal, retroperitoneal, complicaciones pulmonares, absceso u otro foco no aclarado.', 'Colecciones, perforación, abscesos, inflamación profunda y complicaciones.', 'Debe solicitarse según una hipótesis clínica; no es un estudio rutinario para toda fiebre sin foco.'],
      ['Punción lumbar', 'Ante sospecha de meningitis o encefalitis.', 'Células, proteínas, glucosa, microbiología y otros estudios del LCR según sospecha.', 'Cuando la sospecha de meningitis bacteriana es alta, los estudios que demoren el procedimiento no deben retrasar el tratamiento antimicrobiano indicado. Valorar primero si existe indicación de neuroimagen.'],
      ['Estudios microbiológicos dirigidos', 'Según foco, epidemiología y gravedad: muestras respiratorias, cultivos de heridas, líquidos estériles, pruebas moleculares u otros.', 'Identificación del agente causal.', 'Seleccionar pruebas capaces de modificar conducta y evitar paneles indiscriminados sin correlación clínica.'],
      ['Estudios para causas no infecciosas', 'Cuando la evolución, anamnesis o examen sugieran enfermedad inflamatoria, neoplasia, tromboembolismo, reacción farmacológica o hipertermia.', 'Hallazgos específicos de la hipótesis alternativa.', 'La persistencia de fiebre sin foco obliga a reevaluar la posibilidad de etiologías no infecciosas en lugar de ampliar antibióticos automáticamente.']
    ]),
    initialTreatment: richText(
      { kind: 'paragraph', text: 'El tratamiento debe priorizar la estabilidad y la causa subyacente.' },
      { kind: 'heading', text: 'Medidas generales' }, { kind: 'bullet', items: ['monitorización según gravedad', 'acceso vascular cuando corresponda', 'aporte de oxígeno si existe hipoxemia', 'fluidoterapia individualizada cuando existe hipoperfusión o déficit de volumen', 'corrección de glucemia y alteraciones metabólicas', 'analgesia y tratamiento sintomático', 'antitérmicos para confort cuando estén indicados, sin utilizar la respuesta térmica para juzgar gravedad'] },
      { kind: 'heading', text: 'Sepsis y shock' }, { kind: 'paragraph', text: 'Ante sospecha de sepsis con disfunción orgánica, iniciar evaluación y tratamiento de manera inmediata.' }, { kind: 'paragraph', text: 'Obtener cultivos apropiados antes de los antimicrobianos cuando sea posible sin retrasar su administración.' }, { kind: 'paragraph', text: 'Iniciar antimicrobianos empíricos de forma temprana cuando estén indicados, seleccionados según foco probable, gravedad, epidemiología, alergias, exposición sanitaria y patrones locales de resistencia.' }, { kind: 'paragraph', text: 'En pacientes con shock o hipoperfusión, realizar reanimación hemodinámica individualizada y reevaluaciones frecuentes.' },
      { kind: 'heading', text: 'Control del foco' }, { kind: 'paragraph', text: 'Buscar activamente situaciones que requieran drenaje, desbridamiento, retirada de un dispositivo, descompresión o cirugía.' }, { kind: 'paragraph', text: 'Los antibióticos por sí solos pueden ser insuficientes ante abscesos, obstrucciones infectadas, infecciones necrotizantes u otros focos no controlados.' },
      { kind: 'heading', text: 'Neutropenia febril' }, { kind: 'paragraph', text: 'Requiere evaluación inmediata y antibióticos empíricos apropiados sin esperar la aparición de un foco clínico evidente.' },
      { kind: 'heading', text: 'Meningitis bacteriana' }, { kind: 'paragraph', text: 'Si la sospecha es alta, no retrasar el tratamiento antimicrobiano por procedimientos o estudios que puedan demorarlo. Agregar tratamientos adyuvantes cuando correspondan según protocolo.' },
      { kind: 'heading', text: 'Infección necrotizante' }, { kind: 'paragraph', text: 'Requiere evaluación quirúrgica urgente, antibióticos de amplio espectro y control precoz del foco.' },
      { kind: 'heading', text: 'Hipertermia' }, { kind: 'paragraph', text: 'Cuando el cuadro corresponde a hipertermia y no a fiebre regulada, priorizar enfriamiento activo y tratamiento específico de la causa. Los antitérmicos no corrigen el mecanismo de la hipertermia.' },
      { kind: 'paragraph', text: 'Evitar antibióticos empíricos de forma indiscriminada en pacientes estables con alta probabilidad de infección viral o causa no bacteriana cuando no existe indicación clínica.' }
    ),
    reassessment: richText(
      { kind: 'paragraph', text: 'Reevaluar de forma seriada:' },
      { kind: 'bullet', items: ['presión arterial', 'frecuencia cardíaca', 'frecuencia respiratoria', 'saturación', 'temperatura', 'estado mental', 'perfusión', 'diuresis cuando corresponda', 'trabajo respiratorio', 'aparición de nuevos síntomas o signos', 'respuesta al tratamiento', 'resultados microbiológicos y de laboratorio', 'necesidad de control del foco'] },
      { kind: 'paragraph', text: 'En pacientes con sepsis o compromiso sistémico, la tendencia clínica es más importante que un único valor aislado.' },
      { kind: 'paragraph', text: 'La persistencia de fiebre no implica automáticamente fracaso antimicrobiano y la desaparición de la fiebre no demuestra resolución completa.' },
      { kind: 'paragraph', text: 'Ante deterioro, reconsiderar:' }, { kind: 'bullet', items: ['foco no identificado', 'foco no controlado', 'cobertura antimicrobiana inadecuada', 'microorganismo resistente', 'complicación', 'diagnóstico no infeccioso', 'toxicidad medicamentosa'] }
    ),
    disposition: {
      discharge: richText({ kind: 'paragraph', text: 'Considerar alta cuando:' }, { kind: 'bullet', items: ['paciente estable', 'sin disfunción orgánica', 'sin signos de sepsis o shock', 'sin condición tiempo-dependiente identificada', 'sin inmunosupresión de alto riesgo que requiera manejo hospitalario', 'foco benigno o probable infección autolimitada', 'tolera vía oral cuando corresponde', 'tratamiento y seguimiento factibles', 'comprende pautas de alarma', 'existe posibilidad razonable de reevaluación'] }),
      admission: richText({ kind: 'paragraph', text: 'Considerar internación ante:' }, { kind: 'bullet', items: ['sepsis sin shock', 'infección que requiere antibióticos intravenosos', 'necesidad de estudios seriados', 'foco profundo o complicado', 'neumonía moderada/grave', 'pielonefritis complicada', 'endocarditis', 'meningitis o infección del SNC', 'neutropenia febril según estratificación y contexto', 'mala tolerancia oral', 'comorbilidad importante', 'inmunosupresión', 'embarazo con infección significativa', 'incertidumbre clínica relevante', 'seguimiento ambulatorio inseguro'] }),
      criticalCare: richText({ kind: 'paragraph', text: 'Considerar ante:' }, { kind: 'bullet', items: ['shock séptico', 'necesidad de vasopresores', 'insuficiencia respiratoria grave', 'necesidad de ventilación invasiva o soporte avanzado', 'deterioro neurológico importante', 'falla multiorgánica', 'meningococcemia grave', 'hipertermia con disfunción orgánica', 'infección necrotizante con inestabilidad', 'deterioro rápido pese al tratamiento'] }),
      referral: richText({ kind: 'paragraph', text: 'Según el foco y gravedad considerar:' }, { kind: 'bullet', items: ['Infectología.', 'Terapia intensiva.', 'Cirugía general.', 'Urología.', 'Gastroenterología / endoscopia intervencionista.', 'Neurología.', 'Neurocirugía.', 'Hematología / Oncología.', 'Obstetricia.', 'Traumatología.', 'Cirugía cardiovascular.', 'Centro de mayor complejidad.'] })
    },
    warningsAndInstructions: richText({ kind: 'paragraph', text: 'Indicar reevaluación urgente ante:' }, { kind: 'bullet', items: ['dificultad respiratoria', 'confusión, somnolencia o deterioro del sensorio', 'síncope', 'hipotensión o mareos intensos', 'incapacidad para hidratarse', 'oliguria marcada', 'vómitos persistentes', 'convulsiones', 'rigidez de nuca', 'cefalea intensa con fiebre', 'aparición de petequias o púrpura', 'dolor intenso o progresivo', 'aumento rápido del eritema o edema de piel', 'dolor abdominal intenso', 'ictericia', 'deterioro general', 'fiebre en paciente neutropénico o inmunocomprometido', 'fiebre significativa durante embarazo o puerperio', 'persistencia o reaparición de fiebre con empeoramiento clínico'] }),
    commonErrors: richText({ kind: 'bullet', items: ['Evaluar gravedad únicamente por la temperatura máxima.', 'Asumir que una fiebre alta implica automáticamente infección bacteriana.', 'Descartar sepsis porque la presión arterial inicial es normal.', 'Utilizar una única escala como método de exclusión de sepsis.', 'Retrasar antimicrobianos en un paciente con infección grave por esperar todos los estudios.', 'Administrar antibióticos antes de cultivos cuando estos podían obtenerse inmediatamente sin retrasar el tratamiento.', 'Dar antibióticos indiscriminadamente a toda fiebre sin foco.', 'No buscar activamente un foco que requiera drenaje o cirugía.', 'Considerar que ausencia de leucocitosis excluye infección grave.', 'No reconocer neutropenia febril como situación de alto riesgo.', 'No revisar catéteres, prótesis y dispositivos.', 'Omitir examen completo de piel y partes blandas.', 'Confundir fiebre con hipertermia y tratar ambas de la misma manera.', 'Interpretar la desaparición de la fiebre tras antitérmicos como evidencia de benignidad.', 'No considerar causas no infecciosas ante fiebre persistente sin foco.', 'Tratar bacteriuria asintomática como infección urinaria en contextos donde no corresponde.', 'Solicitar cultivos y paneles microbiológicos indiscriminadamente sin una pregunta clínica.', 'No reevaluar la evolución después del tratamiento inicial.'] }),
    clinicalPearls: richText({ kind: 'bullet', items: ['En fiebre, la pregunta principal no es “¿cuánto marca el termómetro?”, sino “¿hay disfunción orgánica o un huésped de alto riesgo?”.', 'La sepsis puede existir sin hipotensión inicial.', 'La ausencia de leucocitosis no excluye infección grave.', 'Un paciente neutropénico puede tener una infección severa con pocos signos inflamatorios locales.', 'Los cultivos deben obtenerse antes de antibióticos cuando sea posible, pero nunca a costa de retrasar tratamiento urgente.', 'El control del foco es tan importante como elegir el antimicrobiano correcto.', 'Un absceso, una vía biliar obstruida o una infección necrotizante rara vez se resuelven solo ampliando antibióticos.', 'La bacteriuria no demuestra que el foco de la fiebre sea urinario.', 'La respuesta a antitérmicos no diferencia infección bacteriana de viral.', 'Temperatura muy elevada con alteración neurológica, exposición al calor o fármacos debe hacer pensar en hipertermia.', 'Fiebre persistente sin foco no significa “más antibióticos”; exige revisar el diagnóstico.', 'Dispositivos y material protésico deben considerarse siempre como posibles focos.', 'En pacientes vulnerables, la evolución clínica puede ser más informativa que los signos clásicos de inflamación.', 'Toda reevaluación debe preguntarse nuevamente si existe un foco que necesita control invasivo.'] })
  };
}

const feverDecisionTree: DecisionTree = {
  rootNodeId: 'fever-start',
  nodes: [
    { id: 'fever-start', type: 'start', title: 'Paciente con fiebre', description: 'Confirmar el contexto clínico de la temperatura, evaluar estabilidad, buscar disfunción orgánica, foco probable y factores de alto riesgo.' },
    { id: 'fever-unstable', type: 'question', title: '¿Existe inestabilidad, disfunción orgánica o deterioro clínico importante?', description: 'Considerar hipotensión, alteración del sensorio, hipoxemia, oliguria, hipoperfusión, dificultad respiratoria o deterioro rápido.' },
    { id: 'fever-stabilize', type: 'warning', title: 'Reanimación y tratamiento urgente', description: 'Iniciar soporte fisiológico, obtener estudios prioritarios y tratar la causa en paralelo.' },
    { id: 'fever-hyperthermia', type: 'question', title: '¿El cuadro sugiere hipertermia en lugar de fiebre regulada?', description: 'Considerar golpe de calor, síndrome serotoninérgico, síndrome neuroléptico maligno u otros síndromes hipermetabólicos.' },
    { id: 'fever-hyperthermia-action', type: 'warning', title: 'Tratar hipertermia y causa desencadenante', description: 'Priorizar enfriamiento activo y manejo específico; los antitérmicos no corrigen el mecanismo de la hipertermia.' },
    { id: 'fever-neutropenia', type: 'question', title: '¿Existe neutropenia conocida o alto riesgo de neutropenia?', description: 'Considerar especialmente quimioterapia reciente, neoplasias hematológicas o inmunosupresión relevante.' },
    { id: 'fever-neutropenia-action', type: 'warning', title: 'Manejo urgente de neutropenia febril', description: 'Obtener cultivos apropiados e iniciar antimicrobianos empíricos indicados sin esperar la aparición de un foco evidente.' },
    { id: 'fever-cns', type: 'question', title: '¿Hay sospecha de meningitis, encefalitis o infección invasiva del SNC?', description: 'Buscar cefalea intensa, meningismo, alteración mental, convulsiones, focalidad o exantema compatible.' },
    { id: 'fever-cns-action', type: 'warning', title: 'Evaluación y tratamiento urgente del SNC', description: 'Realizar estudios indicados sin retrasar antimicrobianos cuando la sospecha de infección bacteriana grave sea alta.' },
    { id: 'fever-necrotizing', type: 'question', title: '¿Hay datos de infección necrotizante de piel o partes blandas?', description: 'Considerar dolor desproporcionado, progresión rápida, bullas, necrosis, crepitación, anestesia cutánea o toxicidad sistémica.' },
    { id: 'fever-necrotizing-action', type: 'warning', title: 'Evaluación quirúrgica y control urgente del foco', description: 'Iniciar antibióticos apropiados y obtener evaluación quirúrgica inmediata.' },
    { id: 'fever-source', type: 'question', title: '¿Existe un foco clínico probable?', description: 'Integrar anamnesis y examen para identificar foco respiratorio, urinario, abdominal, piel, osteoarticular, odontógeno, dispositivo u otro.' },
    { id: 'fever-respiratory', type: 'action', title: 'Evaluar foco respiratorio', description: 'Valorar neumonía u otra infección respiratoria y su gravedad mediante examen, oximetría e imagen cuando corresponda.' },
    { id: 'fever-urinary', type: 'action', title: 'Evaluar foco urinario', description: 'Valorar infección urinaria, pielonefritis, obstrucción y factores de complicación.' },
    { id: 'fever-abdominal', type: 'action', title: 'Evaluar foco abdominal o hepatobiliar', description: 'Buscar infección intraabdominal, colecistitis, colangitis, absceso u otra condición que requiera control del foco.' },
    { id: 'fever-skin-device', type: 'action', title: 'Evaluar piel, partes blandas, heridas y dispositivos', description: 'Buscar celulitis, absceso, infección de herida, catéter o material protésico.' },
    { id: 'fever-other-source', type: 'action', title: 'Evaluar otros focos dirigidos', description: 'Considerar osteoarticular, odontógeno, endocarditis, obstétrico u otros focos según clínica.' },
    { id: 'fever-no-source', type: 'action', title: 'Fiebre sin foco evidente', description: 'Valorar gravedad, huésped, epidemiología y necesidad de estudios dirigidos evitando paneles indiscriminados.' },
    { id: 'fever-high-risk', type: 'question', title: '¿El paciente pertenece a un grupo de alto riesgo?', description: 'Considerar inmunosupresión, embarazo/puerperio, edad avanzada, dispositivos, comorbilidad significativa o exposición sanitaria relevante.' },
    { id: 'fever-testing', type: 'action', title: 'Seleccionar estudios según foco y riesgo', description: 'Utilizar laboratorio, cultivos, imágenes y microbiología dirigida según probabilidad clínica y gravedad.' },
    { id: 'fever-bacterial-treatment', type: 'question', title: '¿Existe indicación de tratamiento antimicrobiano empírico?', description: 'Basar la decisión en gravedad, foco probable, huésped, epidemiología y posibilidad de infección bacteriana significativa.' },
    { id: 'fever-antibiotics', type: 'action', title: 'Iniciar tratamiento antimicrobiano apropiado', description: 'Seleccionar cobertura según foco, gravedad, alergias, exposiciones y patrones locales de resistencia.' },
    { id: 'fever-supportive', type: 'action', title: 'Manejo sintomático y observación clínica', description: 'Tratar síntomas, hidratación cuando corresponda y mantener reevaluación sin antibióticos innecesarios.' },
    { id: 'fever-source-control', type: 'question', title: '¿El foco requiere control invasivo?', description: 'Considerar drenaje, cirugía, desbridamiento, retirada de dispositivo o descompresión.' },
    { id: 'fever-reassess', type: 'action', title: 'Reevaluar evolución y respuesta', description: 'Reevaluar signos vitales, perfusión, estado mental, foco, estudios, cultivos y respuesta al tratamiento.' },
    { id: 'fever-critical', type: 'disposition', title: 'Cuidados críticos / intervención urgente', description: 'Indicado ante shock, falla orgánica, insuficiencia respiratoria grave, deterioro neurológico o necesidad de soporte avanzado.' },
    { id: 'fever-admit', type: 'disposition', title: 'Observación o internación', description: 'Indicado cuando requiere tratamiento hospitalario, estudios seriados, control del foco, huésped de alto riesgo o existe incertidumbre clínica relevante.' },
    { id: 'fever-discharge', type: 'disposition', title: 'Alta con tratamiento, seguimiento y pautas de alarma', description: 'Apropiado en paciente estable, sin disfunción orgánica ni condición tiempo-dependiente, con seguimiento y reevaluación posibles.' }
  ],
  edges: [
    { id: 'fv-e01', from: 'fever-start', to: 'fever-unstable' },
    { id: 'fv-e02', from: 'fever-unstable', to: 'fever-stabilize', label: 'Sí' },
    { id: 'fv-e03', from: 'fever-unstable', to: 'fever-hyperthermia', label: 'No' },
    { id: 'fv-e04', from: 'fever-stabilize', to: 'fever-hyperthermia', label: 'Buscar causa en paralelo' },
    { id: 'fv-e05', from: 'fever-hyperthermia', to: 'fever-hyperthermia-action', label: 'Sí' },
    { id: 'fv-e06', from: 'fever-hyperthermia', to: 'fever-neutropenia', label: 'No' },
    { id: 'fv-e07', from: 'fever-hyperthermia-action', to: 'fever-critical', label: 'Disfunción orgánica / grave' },
    { id: 'fv-e08', from: 'fever-hyperthermia-action', to: 'fever-admit', label: 'Estable pero requiere internación' },
    { id: 'fv-e09', from: 'fever-neutropenia', to: 'fever-neutropenia-action', label: 'Sí' },
    { id: 'fv-e10', from: 'fever-neutropenia', to: 'fever-cns', label: 'No' },
    { id: 'fv-e11', from: 'fever-neutropenia-action', to: 'fever-testing' },
    { id: 'fv-e12', from: 'fever-cns', to: 'fever-cns-action', label: 'Sí' },
    { id: 'fv-e13', from: 'fever-cns', to: 'fever-necrotizing', label: 'No' },
    { id: 'fv-e14', from: 'fever-cns-action', to: 'fever-critical', label: 'Inestable / compromiso grave' },
    { id: 'fv-e15', from: 'fever-cns-action', to: 'fever-admit', label: 'Estable pero requiere internación' },
    { id: 'fv-e16', from: 'fever-necrotizing', to: 'fever-necrotizing-action', label: 'Sí' },
    { id: 'fv-e17', from: 'fever-necrotizing', to: 'fever-source', label: 'No' },
    { id: 'fv-e18', from: 'fever-necrotizing-action', to: 'fever-critical', label: 'Inestable / deterioro' },
    { id: 'fv-e19', from: 'fever-necrotizing-action', to: 'fever-admit', label: 'Estable pero requiere internación' },
    { id: 'fv-e20', from: 'fever-source', to: 'fever-respiratory', label: 'Respiratorio' },
    { id: 'fv-e21', from: 'fever-source', to: 'fever-urinary', label: 'Urinario' },
    { id: 'fv-e22', from: 'fever-source', to: 'fever-abdominal', label: 'Abdominal / hepatobiliar' },
    { id: 'fv-e23', from: 'fever-source', to: 'fever-skin-device', label: 'Piel / dispositivo' },
    { id: 'fv-e24', from: 'fever-source', to: 'fever-other-source', label: 'Otro foco' },
    { id: 'fv-e25', from: 'fever-source', to: 'fever-no-source', label: 'Sin foco evidente' },
    { id: 'fv-e26', from: 'fever-respiratory', to: 'fever-high-risk' },
    { id: 'fv-e27', from: 'fever-urinary', to: 'fever-high-risk' },
    { id: 'fv-e28', from: 'fever-abdominal', to: 'fever-high-risk' },
    { id: 'fv-e29', from: 'fever-skin-device', to: 'fever-high-risk' },
    { id: 'fv-e30', from: 'fever-other-source', to: 'fever-high-risk' },
    { id: 'fv-e31', from: 'fever-no-source', to: 'fever-high-risk' },
    { id: 'fv-e32', from: 'fever-high-risk', to: 'fever-testing', label: 'Sí' },
    { id: 'fv-e33', from: 'fever-high-risk', to: 'fever-bacterial-treatment', label: 'No' },
    { id: 'fv-e34', from: 'fever-testing', to: 'fever-bacterial-treatment' },
    { id: 'fv-e35', from: 'fever-bacterial-treatment', to: 'fever-antibiotics', label: 'Sí' },
    { id: 'fv-e36', from: 'fever-bacterial-treatment', to: 'fever-supportive', label: 'No' },
    { id: 'fv-e37', from: 'fever-antibiotics', to: 'fever-source-control' },
    { id: 'fv-e38', from: 'fever-supportive', to: 'fever-reassess' },
    { id: 'fv-e39', from: 'fever-source-control', to: 'fever-critical', label: 'Urgente / inestable' },
    { id: 'fv-e40', from: 'fever-source-control', to: 'fever-reassess', label: 'No urgente / controlado' },
    { id: 'fv-e41', from: 'fever-reassess', to: 'fever-admit', label: 'No cumple criterios de alta' },
    { id: 'fv-e42', from: 'fever-reassess', to: 'fever-discharge', label: 'Alta segura' }
  ]
};

export function createFeverClinicalApproach(userId: string): ClinicalApproach {
  const timestamp = new Date().toISOString();
  const content: ClinicalApproachContent = {
    ...createFeverApproachBaseContent(),
    decisionTree: feverDecisionTree,
    relatedContent: []
  };
  const validation = validateDecisionTree(content.decisionTree);
  if (validation.errors.length > 0) throw new Error(`El fixture de Fiebre contiene un árbol inválido: ${validation.errors.map((issue) => issue.message).join(' ')}`);
  return {
    id: crypto.randomUUID(),
    userId,
    title: FEVER_APPROACH_TITLE,
    description: FEVER_APPROACH_DESCRIPTION,
    categoryId: null,
    category: null,
    content,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'complete'
  };
}
