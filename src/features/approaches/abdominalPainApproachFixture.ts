import type { TipTapDocument } from '../../types/topic';
import type { ClinicalApproach, ComplementaryStudy, DifferentialDiagnosisItem, ReasoningItem } from './clinicalApproachTypes';
import { validateDecisionTree } from './decisionTreeValidation';

type TextBlock = { kind: 'paragraph' | 'heading'; text: string } | { kind: 'bullet'; items: string[] };
const textNode = (text: string) => ({ type: 'text', text });
const richText = (...blocks: TextBlock[]): TipTapDocument => ({ type: 'doc', content: blocks.map((block) => block.kind === 'bullet'
  ? { type: 'bulletList', content: block.items.map((item) => ({ type: 'listItem', content: [{ type: 'paragraph', content: [textNode(item)] }] })) }
  : { type: block.kind, ...(block.kind === 'heading' ? { attrs: { level: 3 } } : {}), content: [textNode(block.text)] }) });
const paragraph = (text: string): TipTapDocument => richText({ kind: 'paragraph', text });
const stableId = (group: number, index: number) => `${(100 + group).toString().padStart(8, '0')}-0000-4000-8000-${index.toString().padStart(12, '0')}`;
const reasoning = (group: number, entries: Array<[string, string, string]>): ReasoningItem[] => entries.map(([title, content, whyItMatters], index) => ({ id: stableId(group, index + 1), title, content: paragraph(content), whyItMatters: paragraph(whyItMatters) }));
const differentials = (group: number, entries: Array<[string, string]>): DifferentialDiagnosisItem[] => entries.map(([title, explanation], index) => ({ id: stableId(group, index + 1), title, explanation: paragraph(explanation) }));
const studies = (entries: Array<[string, string, string, string]>): ComplementaryStudy[] => entries.map(([name, whenToOrder, targetFinding, interpretation], index) => ({ id: stableId(5, index + 1), name, whenToOrder: paragraph(whenToOrder), targetFinding: paragraph(targetFinding), interpretation: paragraph(interpretation) }));

export const ABDOMINAL_PAIN_APPROACH_TITLE = 'Dolor abdominal';

export function createAbdominalPainClinicalApproach(userId: string): ClinicalApproach {
  const timestamp = new Date().toISOString();
  const approach: ClinicalApproach = {
    id: crypto.randomUUID(), userId, title: ABDOMINAL_PAIN_APPROACH_TITLE,
    description: 'Abordaje inicial del paciente con dolor abdominal agudo, orientado a evaluar estabilidad, reconocer emergencias quirúrgicas, vasculares y gineco-obstétricas, organizar el diagnóstico diferencial, seleccionar estudios y definir tratamiento, reevaluación y disposición.',
    categoryId: null, category: null, createdAt: timestamp, updatedAt: timestamp, status: 'complete',
    content: {
      version: 1,
      presentation: richText(
        { kind: 'paragraph', text: 'El dolor abdominal es uno de los motivos de consulta más frecuentes y comprende un espectro que va desde procesos autolimitados hasta enfermedades que requieren cirugía o tratamiento inmediato.' },
        { kind: 'paragraph', text: 'La intensidad del dolor por sí sola no determina la gravedad. Algunas patologías potencialmente mortales pueden comenzar con hallazgos físicos poco llamativos, especialmente en adultos mayores, pacientes inmunocomprometidos, embarazadas y personas que reciben corticoides o analgésicos.' },
        { kind: 'paragraph', text: 'El objetivo inicial es responder de forma ordenada:' },
        { kind: 'bullet', items: ['¿El paciente está estable?', '¿Existe peritonitis, shock, hemorragia, isquemia, perforación u otra emergencia?', '¿El cuadro requiere cirugía urgente?', '¿La localización y las características orientan a una etiología?', '¿Qué estudios realmente necesita?', '¿Puede recibir el alta o requiere observación, internación, cuidados críticos o intervención?'] }
      ),
      initialAssessment: richText(
        { kind: 'paragraph', text: 'Realizar evaluación inicial de:' },
        { kind: 'bullet', items: ['vía aérea', 'respiración', 'circulación', 'estado de conciencia', 'frecuencia cardíaca', 'presión arterial', 'frecuencia respiratoria', 'saturación de oxígeno', 'temperatura', 'perfusión periférica', 'estado de hidratación', 'intensidad y evolución del dolor'] },
        { kind: 'paragraph', text: 'Buscar signos de inestabilidad:' },
        { kind: 'bullet', items: ['hipotensión', 'shock', 'alteración del sensorio', 'hipoperfusión', 'palidez o diaforesis marcada', 'taquicardia significativa', 'hemorragia activa', 'hematemesis o hematoquecia significativa', 'abdomen rígido o claramente peritonítico', 'dolor desproporcionado al examen físico', 'masa abdominal pulsátil', 'compromiso respiratorio', 'sepsis'] },
        { kind: 'paragraph', text: 'Ante un paciente inestable, reanimación y diagnóstico deben realizarse simultáneamente.' },
        { kind: 'paragraph', text: 'Según el cuadro puede requerirse:' },
        { kind: 'bullet', items: ['monitorización', 'accesos venosos', 'fluidoterapia', 'hemoderivados', 'laboratorio urgente', 'analgesia', 'antibióticos', 'evaluación quirúrgica precoz'] }
      ),
      lifeThreats: richText(
        { kind: 'paragraph', text: 'Las principales enfermedades potencialmente mortales o tiempo-dependientes que deben considerarse prioritariamente son:' },
        { kind: 'bullet', items: ['aneurisma de aorta abdominal roto', 'isquemia mesentérica aguda', 'perforación de víscera hueca', 'obstrucción intestinal complicada o estrangulada', 'hemorragia intraabdominal', 'embarazo ectópico roto', 'torsión ovárica', 'sepsis intraabdominal', 'pancreatitis grave', 'colangitis grave'] },
        { kind: 'heading', text: 'Aneurisma de aorta abdominal roto' }, { kind: 'paragraph', text: 'Considerar especialmente en adultos mayores o pacientes con riesgo vascular ante dolor abdominal, lumbar o dorsal de comienzo brusco asociado a síncope, hipotensión o signos de shock. La tríada clásica completa puede estar ausente.' },
        { kind: 'heading', text: 'Isquemia mesentérica aguda' }, { kind: 'paragraph', text: 'Pensar ante dolor intenso, especialmente cuando es desproporcionado al examen físico, y en pacientes con fibrilación auricular, aterosclerosis, insuficiencia cardíaca, estados de bajo flujo o factores trombóticos. Puede progresar hacia necrosis intestinal, peritonitis y shock.' },
        { kind: 'heading', text: 'Perforación de víscera hueca' }, { kind: 'paragraph', text: 'Considerar ante dolor súbito intenso, defensa, rigidez, rebote, antecedente de enfermedad ulcerosa, diverticulitis, neoplasia, procedimiento endoscópico o trauma.' },
        { kind: 'heading', text: 'Obstrucción intestinal complicada' }, { kind: 'paragraph', text: 'Pensar ante dolor cólico, distensión, vómitos y ausencia de eliminación de gases o materia fecal. La aparición de dolor continuo intenso, fiebre, taquicardia, peritonismo o deterioro clínico aumenta la preocupación por estrangulación e isquemia.' },
        { kind: 'heading', text: 'Hemorragia intraabdominal' }, { kind: 'paragraph', text: 'Considerar ante trauma, embarazo ectópico, rotura aneurismática, lesión esplénica, anticoagulación u otras causas de hemoperitoneo. Puede manifestarse con dolor, síncope, hipotensión, taquicardia y palidez.' },
        { kind: 'heading', text: 'Embarazo ectópico roto' }, { kind: 'paragraph', text: 'Considerar embarazo ante dolor abdominal o pélvico en toda persona con posibilidad biológica de embarazo cuando corresponda clínicamente. Amenorrea, sangrado vaginal, síncope e inestabilidad aumentan la sospecha.' },
        { kind: 'heading', text: 'Torsión ovárica' }, { kind: 'paragraph', text: 'Dolor pélvico o abdominal inferior habitualmente súbito, intenso y unilateral, frecuentemente acompañado de náuseas o vómitos. Constituye una urgencia ginecológica.' },
        { kind: 'heading', text: 'Sepsis intraabdominal' }, { kind: 'paragraph', text: 'Puede originarse en perforación, colecistitis complicada, colangitis, apendicitis perforada, diverticulitis complicada, abscesos u otras infecciones. Buscar disfunción orgánica además de los hallazgos abdominales.' },
        { kind: 'heading', text: 'Pancreatitis grave' }, { kind: 'paragraph', text: 'Considerar especialmente ante dolor epigástrico intenso irradiado a espalda, vómitos y signos de respuesta sistémica o falla orgánica.' },
        { kind: 'heading', text: 'Colangitis grave' }, { kind: 'paragraph', text: 'Considerar ante dolor en hipocondrio derecho, fiebre e ictericia. Hipotensión o alteración del sensorio sugieren enfermedad grave.' },
        { kind: 'paragraph', text: 'También recordar que un infarto agudo de miocardio, especialmente inferior, puede presentarse predominantemente con dolor epigástrico, náuseas o vómitos.' }
      ),
      anamnesis: reasoning(1, [
        ['Inicio de los síntomas', 'Preguntar cuándo comenzó el dolor, si fue súbito o progresivo y si alcanzó máxima intensidad inmediatamente.', 'Un comienzo súbito obliga a considerar eventos vasculares, perforación, torsión, cólico renal y otras emergencias tiempo-dependientes.'],
        ['Localización inicial', 'Preguntar dónde comenzó exactamente el dolor, diferenciándolo de la localización actual.', 'El sitio de inicio puede orientar más que la localización actual. Por ejemplo, la apendicitis puede comenzar con dolor periumbilical y luego migrar a fosa ilíaca derecha.'],
        ['Migración', 'Preguntar si el dolor cambió de localización desde su inicio.', 'La migración es un dato clínico útil para determinadas etiologías y debe diferenciarse de la irradiación.'],
        ['Características del dolor', 'Determinar si el dolor es cólico, continuo, urente, punzante, desgarrador, opresivo o sordo.', 'El patrón puede orientar hacia obstrucción, inflamación, isquemia, enfermedad visceral o dolor de pared, aunque ninguna característica aislada es diagnóstica.'],
        ['Intensidad y evolución', 'Determinar intensidad inicial y actual, progresión, recurrencia y respuesta a medidas previas.', 'La evolución temporal ayuda a diferenciar cuadros autolimitados de patologías progresivas. La intensidad por sí sola no determina gravedad.'],
        ['Irradiación', 'Preguntar por irradiación hacia espalda, hombros, escápulas, ingle o genitales.', 'Epigastrio hacia espalda puede orientar a pancreatitis; hipocondrio derecho hacia hombro o escápula a patología biliar; flanco hacia ingle a cólico ureteral.'],
        ['Síntomas digestivos asociados', 'Preguntar por náuseas, vómitos, diarrea, constipación, ausencia de eliminación de gases, distensión, anorexia, hematemesis, melena, hematoquecia e ictericia.', 'Permiten orientar hacia obstrucción, infección, sangrado gastrointestinal, enfermedad hepatobiliar y otras causas.'],
        ['Relación entre dolor y vómitos', 'Determinar si el dolor comenzó antes de los vómitos o si los vómitos precedieron al dolor.', 'La secuencia temporal puede aportar información útil para jerarquizar el diagnóstico diferencial.'],
        ['Tránsito intestinal', 'Preguntar por última deposición, características de las heces y eliminación de gases.', 'La ausencia de materia fecal y gases, especialmente asociada a distensión y vómitos, aumenta la sospecha de obstrucción intestinal.'],
        ['Síntomas urinarios', 'Preguntar por disuria, polaquiuria, urgencia, hematuria, dolor lumbar, dificultad miccional y retención.', 'Ayudan a diferenciar patología urinaria, renal y ureteral de enfermedades intraabdominales.'],
        ['Antecedentes gineco-obstétricos', 'Cuando corresponda preguntar fecha de última menstruación, posibilidad de embarazo, anticoncepción, sangrado vaginal, flujo, dolor pélvico, antecedentes de embarazo ectópico, procedimientos reproductivos y quistes ováricos.', 'Embarazo ectópico, torsión ovárica y otras patologías ginecológicas pueden presentarse como dolor abdominal agudo.'],
        ['Antecedentes quirúrgicos', 'Preguntar por cirugías abdominales previas, hernias y episodios anteriores de obstrucción.', 'Las adherencias postoperatorias constituyen una causa frecuente de obstrucción intestinal.'],
        ['Antecedentes gastrointestinales y hepatobiliares', 'Preguntar por litiasis biliar, pancreatitis, enfermedad ulcerosa, enfermedad inflamatoria intestinal, diverticulitis y hepatopatía.', 'Los antecedentes pueden aumentar considerablemente la probabilidad pretest de determinadas etiologías.'],
        ['Antecedentes cardiovasculares y trombóticos', 'Preguntar por fibrilación auricular, aterosclerosis, aneurisma aórtico, enfermedad vascular periférica, insuficiencia cardíaca y estados protrombóticos.', 'Son especialmente importantes ante sospecha de isquemia mesentérica o enfermedad aórtica.'],
        ['Medicación', 'Preguntar por AINE, anticoagulantes, antiagregantes, corticoides, opioides, antibióticos recientes e inmunosupresores.', 'Los AINE aumentan el riesgo de enfermedad ulcerosa; los anticoagulantes aumentan el riesgo hemorrágico y los corticoides o inmunosupresores pueden modificar la expresión clínica de cuadros graves.']
      ]),
      physicalExam: reasoning(2, [
        ['Apariencia general', 'Evaluar palidez, sudoración, inquietud, inmovilidad, deshidratación, estado tóxico y nivel de conciencia.', 'La apariencia general puede revelar shock, sepsis, dolor visceral intenso o irritación peritoneal.'],
        ['Signos vitales', 'Evaluar presión arterial, frecuencia cardíaca, frecuencia respiratoria, saturación de oxígeno y temperatura.', 'Hipotensión, taquicardia, fiebre o taquipnea pueden indicar infección grave, hipovolemia, sangrado o compromiso sistémico. Signos vitales normales no excluyen enfermedad grave temprana.'],
        ['Inspección abdominal', 'Evaluar distensión, cicatrices, hernias, equimosis, masas visibles y movimiento de la pared abdominal.', 'Puede aportar datos de obstrucción, cirugía previa, trauma, hernias o enfermedad avanzada.'],
        ['Auscultación', 'Evaluar los ruidos intestinales dentro del contexto general del examen.', 'Los ruidos pueden estar aumentados, disminuidos o ausentes, pero tienen utilidad limitada de forma aislada y no deben retrasar el resto de la evaluación.'],
        ['Palpación abdominal', 'Determinar localización de máxima sensibilidad, defensa voluntaria o involuntaria, rigidez, rebote, masas y organomegalias.', 'Defensa involuntaria, rigidez y signos claros de irritación peritoneal son hallazgos de alarma.'],
        ['Signos de irritación peritoneal', 'Evaluar dolor con movimientos, tos, percusión y otras maniobras clínicas según corresponda.', 'La presencia de irritación peritoneal aumenta considerablemente la preocupación por perforación, inflamación avanzada, isquemia u otra enfermedad quirúrgica.'],
        ['Signos específicos', 'Utilizar según hipótesis clínica maniobras como Murphy, McBurney, Rovsing, psoas, obturador y puño-percusión lumbar.', 'Pueden contribuir al razonamiento diagnóstico, pero ningún signo aislado confirma ni excluye una enfermedad.'],
        ['Hernias', 'Examinar regiones inguinales, femorales, umbilicales e incisionales cuando corresponda.', 'Una hernia incarcerada o estrangulada puede causar obstrucción e isquemia intestinal.'],
        ['Aorta y pulsos', 'Evaluar pulsos periféricos y buscar masa pulsátil cuando la edad o el contexto vascular lo justifiquen.', 'Puede orientar hacia aneurisma o enfermedad vascular.'],
        ['Evaluación lumbar y renal', 'Buscar dolor en flancos y puño-percusión lumbar.', 'Puede orientar hacia pielonefritis, litiasis u otras patologías retroperitoneales.'],
        ['Examen rectal selectivo', 'Realizar cuando exista una indicación clínica específica, como hemorragia digestiva, impactación, patología anorectal o cuando el hallazgo pueda modificar la conducta.', 'No aporta información suficiente para justificar su realización rutinaria en todo paciente con dolor abdominal.'],
        ['Evaluación ginecológica selectiva', 'Realizar examen ginecológico o pélvico cuando los síntomas y el diagnóstico diferencial lo indiquen.', 'Puede ser relevante ante embarazo ectópico, enfermedad inflamatoria pélvica, torsión y otras causas ginecológicas.']
      ]),
      differentialDiagnosis: {
        lifeThreatening: differentials(3, [
          ['Aneurisma de aorta abdominal roto', 'Considerar especialmente en adultos mayores o pacientes con riesgo vascular ante dolor abdominal o lumbar súbito asociado a síncope, hipotensión o shock.'],
          ['Isquemia mesentérica aguda', 'Debe sospecharse ante dolor intenso, particularmente cuando inicialmente es desproporcionado al examen físico, y en pacientes con factores embólicos, ateroscleróticos o de bajo flujo.'],
          ['Perforación de víscera hueca', 'Puede producir dolor súbito, peritonitis, neumoperitoneo, sepsis y rápido deterioro.'],
          ['Obstrucción intestinal estrangulada', 'La obstrucción asociada a compromiso vascular intestinal puede evolucionar a necrosis, perforación y sepsis.'],
          ['Hemorragia intraabdominal', 'Puede producir shock hipovolémico. Considerar trauma, anticoagulación, patología vascular, esplénica y gineco-obstétrica.'],
          ['Embarazo ectópico roto', 'Emergencia hemorrágica a considerar en personas con posibilidad de embarazo y dolor abdominal o pélvico.'],
          ['Torsión ovárica', 'Urgencia ginecológica por compromiso vascular del ovario, generalmente con dolor súbito unilateral y náuseas o vómitos.'],
          ['Sepsis intraabdominal', 'Puede surgir de perforación, infección biliar, apendicitis o diverticulitis complicada y otras fuentes abdominales.'],
          ['Pancreatitis grave', 'La pancreatitis asociada a falla orgánica o compromiso sistémico puede requerir tratamiento intensivo.'],
          ['Colangitis grave', 'La obstrucción e infección de la vía biliar puede evolucionar rápidamente a sepsis y shock.']
        ]),
        common: differentials(4, [
          ['Gastroenteritis', 'Suele asociar dolor cólico, diarrea, náuseas o vómitos, después de excluir diagnósticos alternativos relevantes.'],
          ['Apendicitis', 'Puede comenzar con dolor periumbilical que migra a fosa ilíaca derecha, anorexia, náuseas y sensibilidad localizada.'],
          ['Colelitiasis / cólico biliar', 'Dolor episódico en hipocondrio derecho o epigastrio, frecuentemente posterior a comidas y sin inflamación sistémica persistente.'],
          ['Colecistitis', 'Dolor persistente en hipocondrio derecho, fiebre y sensibilidad localizada, habitualmente asociado a litiasis.'],
          ['Diverticulitis', 'Dolor habitualmente localizado en cuadrante inferior izquierdo, con cambios del tránsito y posible fiebre.'],
          ['Constipación', 'Puede causar dolor, distensión y disminución del tránsito, pero exige descartar obstrucción u otras causas.'],
          ['Dispepsia / gastritis', 'Molestia o ardor epigástrico relacionado con comidas, náuseas o plenitud.'],
          ['Enfermedad ulcerosa péptica', 'Dolor epigástrico relacionado con comidas; el dolor súbito intenso obliga a descartar perforación.'],
          ['Cólico renal', 'Dolor intenso en flanco con irradiación a ingle, inquietud, náuseas y posible hematuria.'],
          ['Infección urinaria', 'Puede presentar dolor suprapúbico o lumbar junto con disuria, urgencia, polaquiuria o fiebre.'],
          ['Pancreatitis', 'Dolor epigástrico persistente irradiado a espalda, asociado con náuseas, vómitos y elevación de lipasa.']
        ]),
        contextual: differentials(6, [
          ['Hepatitis', 'Puede causar dolor en hipocondrio derecho, malestar, ictericia y alteraciones del hepatograma.'], ['Colitis', 'Dolor con diarrea, urgencia, sangre o síntomas inflamatorios según la etiología.'],
          ['Enfermedad inflamatoria intestinal', 'Considerar ante diarrea crónica o sanguinolenta, pérdida de peso, dolor recurrente y manifestaciones extraintestinales.'], ['Síndrome de intestino irritable', 'Dolor recurrente relacionado con defecación y cambios del hábito intestinal, sin signos de alarma.'],
          ['Enfermedad inflamatoria pélvica', 'Dolor pélvico con flujo, fiebre, sangrado anormal o sensibilidad ginecológica.'], ['Endometriosis', 'Dolor pélvico cíclico, dismenorrea, dispareunia o síntomas relacionados con menstruación.'],
          ['Quiste ovárico', 'Puede causar dolor pélvico unilateral; dolor súbito obliga a considerar rotura o torsión.'], ['Retención urinaria', 'Distensión y dolor suprapúbico con dificultad o imposibilidad para orinar.'],
          ['Herpes zóster', 'Dolor neuropático localizado que puede preceder a las lesiones vesiculares.'], ['Neumonía basal', 'Puede manifestarse como dolor abdominal superior, especialmente con fiebre, tos o síntomas respiratorios.'],
          ['Infarto agudo de miocardio inferior', 'Puede presentarse con dolor epigástrico, náuseas o vómitos, sobre todo en pacientes de riesgo.'], ['Cetoacidosis diabética', 'Dolor abdominal con hiperglucemia, deshidratación, vómitos, respiración profunda y acidosis.'],
          ['Crisis suprarrenal', 'Puede causar dolor abdominal, vómitos, hipotensión, trastornos electrolíticos y deterioro sistémico.'], ['Porfiria', 'Considerar ante dolor abdominal recurrente con manifestaciones neurológicas, psiquiátricas o autonómicas.'],
          ['Intoxicaciones', 'Diversos tóxicos y fármacos pueden producir dolor abdominal, vómitos, alteraciones metabólicas o compromiso sistémico.'], ['Dolor de pared abdominal', 'Dolor localizado y reproducible con movimiento o contracción de la pared, tras excluir causas intraabdominales.']
        ])
      },
      complementaryStudies: studies([
        ['Hemograma', 'Ante sospecha de infección, inflamación, sangrado o enfermedad sistémica.', 'Leucocitosis, leucopenia, anemia y alteraciones plaquetarias.', 'Una leucocitosis no confirma por sí sola infección y un hemograma normal no excluye enfermedad quirúrgica temprana.'],
        ['Función renal e ionograma', 'Ante vómitos, deshidratación, sepsis, obstrucción, enfermedad renal o necesidad potencial de contraste.', 'Alteraciones de creatinina, urea, sodio, potasio y otros trastornos hidroelectrolíticos.', 'Ayuda a evaluar repercusión sistémica, deshidratación y seguridad de determinadas estrategias diagnósticas o terapéuticas.'],
        ['Hepatograma', 'Especialmente ante dolor en hipocondrio derecho, ictericia o sospecha hepatobiliar.', 'Bilirrubina, transaminasas, fosfatasa alcalina y otros marcadores disponibles.', 'El patrón puede orientar hacia obstrucción biliar, lesión hepatocelular u otras patologías.'],
        ['Lipasa', 'Ante sospecha de pancreatitis aguda.', 'Elevación compatible con lesión pancreática.', 'Debe interpretarse junto con la clínica y, cuando corresponde, los estudios por imágenes.'],
        ['Orina completa', 'Ante síntomas urinarios, sospecha de litiasis, infección urinaria o hematuria.', 'Hematuria, leucocituria, nitritos y otros hallazgos urinarios.', 'La hematuria puede apoyar litiasis, pero su ausencia no la excluye.'],
        ['Beta-hCG', 'Cuando exista posibilidad de embarazo y el resultado pueda modificar el diagnóstico diferencial o la elección de estudios.', 'Confirmar o excluir embarazo dentro de los límites del método.', 'Debe integrarse con la clínica y ecografía cuando existe sospecha de embarazo ectópico u otra patología obstétrica.'],
        ['Lactato', 'Ante shock, sepsis, hipoperfusión o sospecha de isquemia mesentérica.', 'Evidencia de hipoperfusión o metabolismo anaeróbico.', 'Un lactato elevado puede indicar gravedad, pero un lactato normal inicial no excluye isquemia mesentérica.'],
        ['ECG de 12 derivaciones', 'Cuando el dolor epigástrico pueda representar síndrome coronario agudo, especialmente en adultos mayores o pacientes con riesgo cardiovascular.', 'Cambios isquémicos, arritmias y alteraciones de conducción.', 'Permite reconocer causas cardíacas extraabdominales de dolor aparentemente abdominal.'],
        ['Ecografía abdominal', 'Especialmente ante sospecha hepatobiliar, aneurisma aórtico, hidronefrosis, líquido libre u otros cuadros donde la ecografía tenga buena utilidad diagnóstica.', 'Litiasis, signos de colecistitis, dilatación biliar, alteraciones aórticas, hidronefrosis, líquido libre y otros hallazgos dirigidos.', 'Es especialmente útil para patología biliar y determinadas evaluaciones vasculares, urinarias y POCUS.'],
        ['Ecografía ginecológica / transvaginal', 'Ante sospecha de embarazo ectópico, torsión ovárica o patología anexial.', 'Localización del embarazo, líquido libre, masas anexiales, alteraciones ováricas y otros hallazgos.', 'Debe integrarse con beta-hCG, síntomas y evaluación ginecológica.'],
        ['Tomografía abdominopélvica', 'Ante dolor abdominal no claramente diagnosticado o sospecha de apendicitis, diverticulitis, obstrucción, perforación, absceso, complicaciones o patología retroperitoneal.', 'Hallazgos anatómicos que permitan identificar la causa y sus complicaciones.', 'El protocolo y uso de contraste deben seleccionarse según la sospecha clínica.'],
        ['Angio-TC abdominal', 'Ante sospecha de isquemia mesentérica u otra enfermedad vascular abdominal cuando el paciente pueda realizar el estudio.', 'Oclusión arterial o venosa, alteraciones de perfusión intestinal y enfermedad vascular.', 'Es un estudio fundamental en la evaluación de isquemia mesentérica y otras emergencias vasculares seleccionadas.']
      ]),
      decisionTree: {
        rootNodeId: 'abd-start',
        nodes: [
          { id: 'abd-start', type: 'start', title: 'Paciente con dolor abdominal', description: 'Evaluar estabilidad, signos vitales, características del dolor y presencia de amenazas vitales o abdomen quirúrgico.' },
          { id: 'abd-unstable', type: 'question', title: '¿El paciente está hemodinámicamente inestable o presenta deterioro grave?', description: 'Buscar hipotensión, shock, alteración del sensorio, hipoperfusión, hemorragia significativa, sepsis o deterioro clínico.' },
          { id: 'abd-resuscitate', type: 'warning', title: 'Reanimación y evaluación urgente simultáneas', description: 'Monitorización, accesos venosos, tratamiento de soporte, laboratorio urgente, analgesia y búsqueda simultánea de la causa.' },
          { id: 'abd-immediate-threat', type: 'question', title: '¿Existen datos de una amenaza vital inmediata?', description: 'Considerar aneurisma aórtico roto, hemorragia intraabdominal, isquemia mesentérica, perforación, obstrucción estrangulada, embarazo ectópico roto y sepsis abdominal.' },
          { id: 'abd-peritonitis', type: 'question', title: '¿Hay peritonismo o sospecha de perforación/isquemia intestinal?', description: 'Buscar defensa involuntaria, rigidez, rebote, dolor progresivo, signos sistémicos o dolor desproporcionado al examen.' },
          { id: 'abd-surgery', type: 'warning', title: 'Evaluación quirúrgica urgente', description: 'Iniciar estabilización, analgesia y tratamiento indicado mientras se obtiene evaluación quirúrgica e imagen cuando corresponda.' },
          { id: 'abd-vascular', type: 'question', title: '¿Existe sospecha de causa vascular?', description: 'Considerar aneurisma aórtico, isquemia mesentérica u otra enfermedad vascular según edad, factores de riesgo, inicio y examen.' },
          { id: 'abd-vascular-action', type: 'warning', title: 'Evaluación vascular urgente', description: 'Priorizar imagen vascular apropiada y evaluación especializada sin retrasar reanimación cuando exista inestabilidad.' },
          { id: 'abd-pregnancy', type: 'question', title: '¿Existe posibilidad de embarazo?', description: 'Considerar embarazo en toda persona con posibilidad biológica de embarazo cuando clínicamente corresponda.' },
          { id: 'abd-pregnancy-eval', type: 'action', title: 'Evaluar embarazo y causas gineco-obstétricas', description: 'Solicitar beta-hCG y ecografía según contexto. Considerar especialmente embarazo ectópico y torsión ovárica.' },
          { id: 'abd-location', type: 'question', title: '¿Existe una localización o síndrome clínico predominante?', description: 'Integrar inicio, migración, características, irradiación, síntomas acompañantes y examen físico.' },
          { id: 'abd-upper', type: 'action', title: 'Dolor abdominal superior', description: 'Considerar patología hepatobiliar, gástrica, pancreática, cardíaca, vascular y pulmonar según la localización y contexto.' },
          { id: 'abd-lower', type: 'action', title: 'Dolor abdominal inferior', description: 'Considerar apendicitis, diverticulitis, patología urinaria, intestinal y ginecológica.' },
          { id: 'abd-flank', type: 'action', title: 'Dolor en flanco o lumbar', description: 'Considerar litiasis, pielonefritis, patología vascular, retroperitoneal y musculoesquelética.' },
          { id: 'abd-diffuse', type: 'action', title: 'Dolor difuso o mal localizado', description: 'Considerar gastroenteritis, obstrucción, isquemia, peritonitis, causas metabólicas, tóxicas y cuadros tempranos todavía no localizados.' },
          { id: 'abd-testing', type: 'action', title: 'Seleccionar estudios según hipótesis clínica', description: 'Utilizar laboratorio, orina, beta-hCG, ecografía, TC o angio-TC según probabilidad pretest y diagnóstico diferencial.' },
          { id: 'abd-serious-result', type: 'question', title: '¿Los hallazgos confirman o mantienen alta sospecha de enfermedad grave?', description: 'Integrar clínica, evolución, laboratorio e imagen. Un estudio aislado negativo no siempre excluye enfermedad temprana.' },
          { id: 'abd-specific-treatment', type: 'warning', title: 'Tratamiento específico e interconsulta', description: 'Iniciar tratamiento dirigido y definir necesidad de cirugía, intervención, antibióticos, internación o cuidados críticos.' },
          { id: 'abd-reassess', type: 'action', title: 'Analgesia, tratamiento sintomático y reevaluación', description: 'Reevaluar dolor, localización, examen abdominal, signos vitales y evolución luego del tratamiento y período apropiado de observación.' },
          { id: 'abd-after-reassess', type: 'question', title: '¿Persiste dolor significativo, aparecen nuevos hallazgos o existe incertidumbre relevante?', description: 'La evolución puede hacer evidente una enfermedad que no era clara en la evaluación inicial.' },
          { id: 'abd-admit', type: 'disposition', title: 'Observación o internación', description: 'Continuar evaluación o tratamiento cuando persista incertidumbre, dolor importante, intolerancia oral, comorbilidad o necesidad de estudios seriados.' },
          { id: 'abd-critical', type: 'disposition', title: 'Cuidados críticos / intervención urgente', description: 'Indicado ante shock, sepsis grave, hemorragia, isquemia, perforación, falla orgánica o riesgo elevado de deterioro.' },
          { id: 'abd-discharge-question', type: 'question', title: '¿Es seguro el manejo ambulatorio?', description: 'Requiere estabilidad, amenazas vitales razonablemente excluidas, síntomas controlados y posibilidad adecuada de seguimiento.' },
          { id: 'abd-discharge', type: 'disposition', title: 'Alta con seguimiento y pautas de alarma', description: 'Indicar tratamiento correspondiente, seguimiento y signos que deben motivar nueva evaluación urgente.' }
        ],
        edges: [
          { id: 'ab-e01', from: 'abd-start', to: 'abd-unstable' }, { id: 'ab-e02', from: 'abd-unstable', to: 'abd-resuscitate', label: 'Sí' }, { id: 'ab-e03', from: 'abd-unstable', to: 'abd-immediate-threat', label: 'No' },
          { id: 'ab-e04', from: 'abd-resuscitate', to: 'abd-immediate-threat' }, { id: 'ab-e05', from: 'abd-immediate-threat', to: 'abd-peritonitis', label: 'Perforación / isquemia / abdomen agudo' }, { id: 'ab-e06', from: 'abd-immediate-threat', to: 'abd-vascular', label: 'Posible causa vascular' },
          { id: 'ab-e07', from: 'abd-immediate-threat', to: 'abd-pregnancy', label: 'Sin amenaza evidente' }, { id: 'ab-e08', from: 'abd-peritonitis', to: 'abd-surgery', label: 'Sí' }, { id: 'ab-e09', from: 'abd-peritonitis', to: 'abd-vascular', label: 'No' },
          { id: 'ab-e10', from: 'abd-surgery', to: 'abd-critical', label: 'Inestable / grave' }, { id: 'ab-e11', from: 'abd-surgery', to: 'abd-admit', label: 'Estable' }, { id: 'ab-e12', from: 'abd-vascular', to: 'abd-vascular-action', label: 'Sí' },
          { id: 'ab-e13', from: 'abd-vascular', to: 'abd-pregnancy', label: 'No' }, { id: 'ab-e14', from: 'abd-vascular-action', to: 'abd-critical', label: 'Inestable / emergencia' }, { id: 'ab-e15', from: 'abd-vascular-action', to: 'abd-admit', label: 'Estable pero requiere manejo hospitalario' },
          { id: 'ab-e16', from: 'abd-pregnancy', to: 'abd-pregnancy-eval', label: 'Sí' }, { id: 'ab-e17', from: 'abd-pregnancy', to: 'abd-location', label: 'No / no aplica' }, { id: 'ab-e18', from: 'abd-pregnancy-eval', to: 'abd-location' },
          { id: 'ab-e19', from: 'abd-location', to: 'abd-upper', label: 'Superior' }, { id: 'ab-e20', from: 'abd-location', to: 'abd-lower', label: 'Inferior' }, { id: 'ab-e21', from: 'abd-location', to: 'abd-flank', label: 'Flanco / lumbar' },
          { id: 'ab-e22', from: 'abd-location', to: 'abd-diffuse', label: 'Difuso / mal localizado' }, { id: 'ab-e23', from: 'abd-upper', to: 'abd-testing' }, { id: 'ab-e24', from: 'abd-lower', to: 'abd-testing' },
          { id: 'ab-e25', from: 'abd-flank', to: 'abd-testing' }, { id: 'ab-e26', from: 'abd-diffuse', to: 'abd-testing' }, { id: 'ab-e27', from: 'abd-testing', to: 'abd-serious-result' },
          { id: 'ab-e28', from: 'abd-serious-result', to: 'abd-specific-treatment', label: 'Sí' }, { id: 'ab-e29', from: 'abd-serious-result', to: 'abd-reassess', label: 'No' }, { id: 'ab-e30', from: 'abd-specific-treatment', to: 'abd-critical', label: 'Crítico / intervención inmediata' },
          { id: 'ab-e31', from: 'abd-specific-treatment', to: 'abd-admit', label: 'Requiere internación' }, { id: 'ab-e32', from: 'abd-reassess', to: 'abd-after-reassess' }, { id: 'ab-e33', from: 'abd-after-reassess', to: 'abd-admit', label: 'Sí' },
          { id: 'ab-e34', from: 'abd-after-reassess', to: 'abd-discharge-question', label: 'No' }, { id: 'ab-e35', from: 'abd-discharge-question', to: 'abd-discharge', label: 'Sí' }, { id: 'ab-e36', from: 'abd-discharge-question', to: 'abd-admit', label: 'No' }
        ]
      },
      initialTreatment: richText(
        { kind: 'paragraph', text: 'No existe un tratamiento único para el dolor abdominal. La conducta depende de la causa y de la estabilidad del paciente.' },
        { kind: 'heading', text: 'Medidas generales según contexto' }, { kind: 'bullet', items: ['monitorización', 'accesos venosos', 'analgesia adecuada', 'antieméticos', 'hidratación', 'corrección de trastornos hidroelectrolíticos', 'ayuno cuando corresponda', 'tratamiento de shock o sepsis'] },
        { kind: 'paragraph', text: 'La analgesia no debe retrasarse por temor a enmascarar un abdomen quirúrgico. El paciente puede y debe ser reevaluado después del tratamiento.' },
        { kind: 'heading', text: 'Antibióticos' }, { kind: 'paragraph', text: 'Administrar precozmente cuando exista sospecha de infección intraabdominal grave, sepsis, perforación, colangitis u otra indicación específica.' }, { kind: 'paragraph', text: 'No todos los cuadros abdominales inflamatorios requieren antibióticos.' },
        { kind: 'heading', text: 'Evaluación quirúrgica urgente' }, { kind: 'paragraph', text: 'Solicitar precozmente ante:' }, { kind: 'bullet', items: ['peritonitis', 'perforación', 'isquemia intestinal', 'obstrucción estrangulada', 'aneurisma roto', 'hemorragia intraabdominal', 'deterioro progresivo', 'otras emergencias quirúrgicas'] }
      ),
      reassessment: richText(
        { kind: 'paragraph', text: 'La reevaluación constituye una parte central del abordaje del dolor abdominal.' }, { kind: 'paragraph', text: 'Reevaluar de forma seriada:' },
        { kind: 'bullet', items: ['intensidad del dolor', 'localización', 'migración', 'vómitos', 'distensión', 'tránsito intestinal', 'signos vitales', 'perfusión', 'palpación abdominal', 'aparición de defensa o peritonismo', 'respuesta a analgesia', 'resultados de laboratorio e imágenes'] },
        { kind: 'paragraph', text: 'Un abdomen inicialmente inespecífico puede evolucionar hacia un cuadro clínico mucho más definido.' }, { kind: 'paragraph', text: 'El diagnóstico del dolor abdominal es frecuentemente dinámico.' }
      ),
      disposition: {
        discharge: richText({ kind: 'paragraph', text: 'Considerar alta cuando:' }, { kind: 'bullet', items: ['el paciente está estable', 'las amenazas vitales han sido razonablemente excluidas', 'el dolor está controlado', 'no existe peritonismo', 'tolera vía oral cuando corresponda', 'los estudios necesarios son tranquilizadores', 'existe posibilidad de seguimiento', 'comprende las pautas de alarma'] }, { kind: 'paragraph', text: 'No siempre es necesario alcanzar un diagnóstico etiológico definitivo si se ha excluido razonablemente enfermedad grave y existe seguimiento seguro.' }),
        admission: richText({ kind: 'paragraph', text: 'Considerar internación ante:' }, { kind: 'bullet', items: ['dolor persistente significativo', 'enfermedad que requiere tratamiento hospitalario', 'vómitos incoercibles', 'intolerancia oral', 'deshidratación relevante', 'infección significativa', 'necesidad de estudios o reevaluaciones seriadas', 'comorbilidad importante', 'imposibilidad de seguimiento seguro'] }),
        criticalCare: richText({ kind: 'paragraph', text: 'Considerar cuidados críticos ante:' }, { kind: 'bullet', items: ['shock', 'sepsis grave', 'hemorragia significativa', 'isquemia intestinal', 'perforación con compromiso sistémico', 'pancreatitis grave con falla orgánica', 'deterioro hemodinámico', 'necesidad de soporte avanzado'] }),
        referral: richText({ kind: 'paragraph', text: 'Según etiología considerar:' }, { kind: 'bullet', items: ['Cirugía general', 'Cirugía vascular', 'Ginecología', 'Urología', 'Gastroenterología', 'Terapia intensiva', 'Cardiología', 'Centro de mayor complejidad'] })
      },
      warningsAndInstructions: richText({ kind: 'paragraph', text: 'Indicar nueva evaluación urgente ante:' }, { kind: 'bullet', items: ['aumento o persistencia significativa del dolor', 'aparición de dolor localizado intenso', 'fiebre persistente', 'vómitos repetidos', 'hematemesis', 'melena', 'hematoquecia', 'síncope', 'debilidad intensa', 'distensión progresiva', 'imposibilidad de eliminar gases o materia fecal', 'ictericia', 'dificultad respiratoria', 'sangrado vaginal importante', 'empeoramiento general'] }),
      commonErrors: richText({ kind: 'bullet', items: ['Considerar que dolor intenso implica necesariamente gravedad y dolor leve implica benignidad.', 'Dar el alta basándose solamente en análisis de laboratorio normales.', 'Descartar apendicitis por ausencia de fiebre o leucocitosis.', 'Descartar isquemia mesentérica porque inicialmente no existe peritonismo.', 'Esperar lactato elevado para sospechar isquemia intestinal.', 'No considerar embarazo ectópico.', 'No examinar hernias ante sospecha de obstrucción.', 'No considerar infarto agudo de miocardio ante dolor epigástrico.', 'No considerar aneurisma aórtico en adultos mayores o pacientes vasculares.', 'Retrasar innecesariamente la analgesia.', 'Solicitar tomografía indiscriminadamente sin una hipótesis clínica.', 'Interpretar un signo físico aislado como diagnóstico definitivo.', 'No reevaluar el abdomen luego de analgesia y observación.', 'Atribuir prematuramente el cuadro a gastroenteritis.', 'Subestimar presentaciones atípicas en adultos mayores e inmunocomprometidos.'] }),
      clinicalPearls: richText({ kind: 'bullet', items: ['Dolor abdominal es un proceso diagnóstico dinámico y la reevaluación seriada puede ser tan importante como la evaluación inicial.', 'Dolor desproporcionado al examen obliga a considerar isquemia mesentérica.', 'Peritonismo significa irritación peritoneal hasta demostrar lo contrario.', 'Ante posibilidad de embarazo, siempre incorporar embarazo ectópico al diagnóstico diferencial cuando corresponda.', 'La analgesia apropiada no invalida el examen abdominal.', 'Un laboratorio normal no excluye enfermedad quirúrgica temprana.', 'En adultos mayores debe disminuirse el umbral para considerar enfermedad grave.', 'No todo dolor abdominal se origina en el abdomen.', 'Anatomía, fisiopatología, edad, antecedentes y evolución deben integrarse para construir el diagnóstico diferencial.'] }),
      relatedContent: []
    }
  };
  const validation = validateDecisionTree(approach.content.decisionTree);
  if (validation.errors.length > 0) throw new Error(`El fixture de Dolor abdominal contiene un árbol inválido: ${validation.errors.map((issue) => issue.message).join(' ')}`);
  return approach;
}
