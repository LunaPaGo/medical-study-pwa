import type { TipTapDocument } from '../../types/topic';
import type { ClinicalApproach, ClinicalApproachContent, ComplementaryStudy, DecisionTree, DifferentialDiagnosisItem, ReasoningItem } from './clinicalApproachTypes';
import { validateDecisionTree } from './decisionTreeValidation';

type B={kind:'paragraph'|'heading';text:string}|{kind:'bullet';items:string[]};
const t=(text:string)=>({type:'text',text});
const richText=(...blocks:B[]):TipTapDocument=>({type:'doc',content:blocks.map(b=>b.kind==='bullet'?{type:'bulletList',content:b.items.map(x=>({type:'listItem',content:[{type:'paragraph',content:[t(x)]}]}))}:{type:b.kind,...(b.kind==='heading'?{attrs:{level:3}}:{}),content:[t(b.text)]})});
const p=(text:string)=>richText({kind:'paragraph',text});
const id=(g:number,i:number)=>`a17e${g.toString().padStart(4,'0')}-0000-4000-8000-${i.toString().padStart(12,'0')}`;
const reasoning=(g:number,a:Array<[string,string,string]>):ReasoningItem[]=>a.map(([title,content,whyItMatters],i)=>({id:id(g,i+1),title,content:p(content),whyItMatters:p(whyItMatters)}));
const diffs=(g:number,a:Array<[string,string]>):DifferentialDiagnosisItem[]=>a.map(([title,explanation],i)=>({id:id(g,i+1),title,explanation:p(explanation)}));
const studies=(a:Array<[string,string,string,string]>):ComplementaryStudy[]=>a.map(([name,whenToOrder,targetFinding,interpretation],i)=>({id:id(6,i+1),name,whenToOrder:p(whenToOrder),targetFinding:p(targetFinding),interpretation:p(interpretation)}));

export const ALTERED_MENTAL_STATUS_APPROACH_TITLE='Alteración aguda del sensorio';
export const ALTERED_MENTAL_STATUS_APPROACH_DESCRIPTION='Abordaje del paciente con alteración aguda del nivel de conciencia, atención, conducta o cognición, orientado a estabilizar amenazas vitales, medir glucemia precozmente, reconocer causas neurológicas, metabólicas, tóxicas, infecciosas y sistémicas, identificar cuadros tiempo-dependientes y reevaluar de forma seriada el estado neurológico.';

const anamnesis=reasoning(1,[
['Última vez conocido normal','Precisar la hora exacta en que fue visto por última vez en su estado habitual y qué ocurrió desde entonces.','Define ventanas terapéuticas y orienta hacia ACV, intoxicaciones, convulsiones y evolución temporal.'],
['Forma de inicio','Determinar si el cambio fue brusco o progresivo y qué actividad realizaba al comenzar.','El inicio brusco favorece eventos vasculares, convulsión, arritmia o intoxicación; el progresivo orienta a infecciones o causas metabólicas.'],
['Evolución','Establecer si el cuadro permanece estable, fluctúa o progresa y documentar su trayectoria.','La fluctuación es frecuente en delirium, aunque no es específica; el deterioro progresivo exige reevaluación urgente.'],
['Estado mental basal','Conocer demencia, discapacidad, autonomía, conducta y comunicación habituales.','Permite confirmar un cambio agudo real, medir recuperación y evitar atribuirlo erróneamente al estado basal.'],
['Focalidad referida','Preguntar por debilidad, alteración del habla, visión, sensibilidad, coordinación o marcha.','La focalidad sugiere una lesión neurológica estructural y acelera la evaluación de ACV o hemorragia.'],
['Convulsiones','Investigar actividad tónico-clónica, mirada fija, automatismos, incontinencia, mordedura lingual y período postictal.','Una convulsión puede explicar el cuadro, pero una recuperación tardía obliga a considerar status no convulsivo u otra lesión.'],
['Cefalea','Caracterizar inicio súbito, máxima intensidad, progresión y síntomas asociados.','Puede señalar hemorragia subaracnoidea, hipertensión intracraneal, infección o evento vascular.'],
['Fiebre/infección','Buscar fiebre, rigidez cervical, tos, disuria, heridas u otros focos.','Meningitis, encefalitis y sepsis son causas tiempo-dependientes que pueden presentarse con sensorio alterado.'],
['Trauma','Preguntar por caída, golpe craneal, mecanismo y uso de anticoagulantes.','Un trauma no presenciado o minimizado puede causar hematoma intracraneal, especialmente en personas anticoaguladas.'],
['Diabetes','Revisar insulina, hipoglucemiantes, ingesta y episodios previos.','La hipoglucemia y las crisis hiperglucémicas son reversibles y requieren tratamiento precoz.'],
['Medicación habitual','Registrar sedantes, opioides, anticolinérgicos, psicofármacos, anticonvulsivantes y antihipertensivos.','Los efectos adversos, acumulación e interacciones son causas frecuentes y potencialmente reversibles.'],
['Cambios recientes de medicación','Precisar inicio, suspensión, aumento de dosis o nuevas interacciones.','La relación temporal ayuda a identificar toxicidad, abstinencia o descompensación por retirada.'],
['Alcohol','Determinar consumo agudo o crónico y hora de la última ingesta.','Permite considerar intoxicación, abstinencia y déficit de tiamina sin asumir que el alcohol explica todo el cuadro.'],
['Drogas/tóxicos','Indagar opioides, estimulantes, cannabis, sustancias recreativas y productos domésticos o industriales.','La exposición y el toxidrome orientan pruebas y antídotos dirigidos.'],
['Exposición a monóxido de carbono','Preguntar por calefactores, incendio, ambiente cerrado y otras personas afectadas.','La exposición puede ser oculta y la oximetría convencional no descarta intoxicación.'],
['Enfermedad renal/hepática','Revisar enfermedad renal, hepatopatía, adherencia y descompensaciones previas.','Aumenta el riesgo de encefalopatía urémica, alteraciones electrolíticas, acumulación farmacológica e hiperamonemia.'],
['Ingesta y pérdidas','Investigar ayuno, vómitos, diarrea, polidipsia y signos de deshidratación.','Orienta hacia hipoglucemia, trastornos hidroelectrolíticos, hiperosmolaridad e hipoperfusión.'],
['Antecedentes neurológicos','Registrar ACV, epilepsia, tumores, neurocirugía e hidrocefalia.','Modifica la probabilidad de recurrencia, complicaciones estructurales y necesidad de neuroimagen o EEG.'],
['Inmunosupresión','Preguntar por VIH, quimioterapia, trasplante, corticoides u otros inmunosupresores.','Amplía el espectro infeccioso y reduce la confiabilidad de presentaciones típicas como fiebre o meningismo.'],
['Información de terceros','Obtener datos de familia, testigos, emergencias, envases de medicación y escena.','Es esencial cuando el paciente no puede aportar historia y puede revelar cronología, trauma o exposición.']
]);

const physicalExam=reasoning(2,[
['Signos vitales y tendencia','Medir y repetir FC, PA/PAM, FR, SpO2 y su evolución tras intervenciones.','Las tendencias detectan hipoxia, shock, sepsis, toxidromes y deterioro antes que una medición aislada.'],
['Glasgow y tendencia','Documentar componentes ocular, verbal y motor y repetirlos de forma seriada.','La trayectoria neurológica es más útil que un número aislado y orienta protección de vía aérea y neuroimagen.'],
['Pupilas','Evaluar tamaño, simetría y reactividad.','Anisocoria o pérdida de reactividad puede indicar herniación, lesión estructural o toxidrome.'],
['Focalidad neurológica','Buscar asimetría facial, déficit motor o sensitivo, desviación de mirada y alteración de coordinación.','Activa evaluación urgente de ACV, hemorragia u otra lesión focal.'],
['Lenguaje y atención','Valorar comprensión, denominación, fluencia, orientación y capacidad de mantener atención.','Distingue afasia, delirium y compromiso cortical y permite comparar con el basal.'],
['Patrón respiratorio','Observar frecuencia, profundidad, pausas, esfuerzo y signos de hipoventilación.','Hipoxia e hipercapnia son causas reversibles; patrones anormales también pueden sugerir lesión neurológica.'],
['Perfusión','Examinar pulsos, relleno capilar, piel, temperatura periférica y diuresis.','La hipoperfusión cerebral puede alterar el sensorio antes de una hipotensión profunda.'],
['Temperatura','Medir temperatura central o confiable y repetir según evolución.','Fiebre, heat stroke, hipotermia e infección modifican prioridades diagnósticas y terapéuticas.'],
['Signos meníngeos','Buscar rigidez cervical y otros hallazgos compatibles cuando sea seguro.','Apoyan infección del SNC o hemorragia subaracnoidea, aunque su ausencia no las excluye.'],
['Cabeza/trauma','Inspeccionar cuero cabelludo, cara, signos de fractura y lesiones ocultas.','Un TCE puede pasar inadvertido, en especial si la historia es incompleta o hay anticoagulación.'],
['Piel y mucosas','Buscar petequias, púrpura, ictericia, cianosis, deshidratación, marcas de inyección y parches.','Aporta pistas de sepsis, hepatopatía, hipoxia, exposición y estado de volumen.'],
['Toxidromes','Integrar pupilas, piel, secreciones, temperatura, motilidad intestinal, tono y conducta.','Un patrón sindrómico orienta el tóxico probable y evita depender de paneles indiscriminados.'],
['Cardiovascular','Evaluar ritmo, soplos, pulsos y signos de insuficiencia o bajo gasto.','Arritmias, isquemia y embolia pueden causar hipoperfusión, síncope o ACV.'],
['Pulmonar','Auscultar y buscar broncoaspiración, infección, edema, obstrucción o hipoventilación.','La enfermedad respiratoria puede explicar hipoxia o hipercapnia y condicionar la vía aérea.'],
['Abdomen/retención urinaria/globo vesical','Examinar dolor, distensión, ascitis, globo vesical y retención.','Dolor, retención, hepatopatía o patología abdominal pueden precipitar delirium y revelar enfermedad sistémica.'],
['Signos de enfermedad sistémica','Buscar edema, deshidratación, hepatopatía, uremia, endocrinopatía e infección focal.','El estado mental alterado suele ser la manifestación de una enfermedad sistémica o multifactorial.']
]);

const lifeThreatening=diffs(3,[
['Hipoglucemia grave','Causa reversible inmediata; medir glucemia precozmente y tratar sin esperar estudios confirmatorios.'],['ACV isquémico','Sospechar ante inicio brusco o focalidad y activar circuito con última vez normal y neuroimagen urgente.'],['Hemorragia intracraneal','Considerar con cefalea, vómitos, focalidad, hipertensión, trauma o anticoagulación.'],['Hemorragia subaracnoidea','Cefalea súbita máxima, meningismo, síncope o deterioro requieren evaluación urgente.'],['Herniación cerebral / hipertensión intracraneal','Deterioro rápido, anisocoria o posturas anormales exigen neuroprotección y neurocirugía.'],['Status epiléptico convulsivo','La actividad persistente o recurrente requiere benzodiazepina y algoritmo anticonvulsivante inmediato.'],['Status epiléptico no convulsivo','Considerar si persiste alteración inexplicada, especialmente después de convulsiones; requiere EEG.'],['Meningitis bacteriana','Fiebre, meningismo o sepsis pueden ser incompletos; no retrasar antimicrobianos por estudios.'],['Encefalitis','Alteración conductual, convulsiones o focalidad con infección posible justifican antiviral empírico si HSV es plausible.'],['Sepsis/shock séptico','La encefalopatía puede ser temprana; buscar foco, perfusión y disfunción orgánica.'],['Intoxicación por opioides','Depresión respiratoria y miosis orientan; naloxona se titula a ventilación adecuada.'],['Intoxicación por monóxido de carbono','Sospechar en ambientes cerrados o múltiples afectados; indicar oxígeno de alta concentración.'],['Trastorno grave del sodio','Hipo o hipernatremia severa puede causar convulsiones y coma; corregir de forma controlada.'],['Hipoxia/hipercapnia grave','Ambas alteran la conciencia y requieren corrección inmediata de oxigenación o ventilación.']
]);
const common=diffs(4,[
['Delirium secundario a infección','Frecuente, especialmente en mayores; buscar foco aun sin fiebre llamativa.'],['Efecto adverso/polifarmacia','Sedantes, anticolinérgicos e interacciones pueden acumularse, sobre todo con falla renal o hepática.'],['Intoxicación alcohólica','Puede contribuir, pero nunca debe excluir trauma, hipoglucemia o lesión intracraneal.'],['Abstinencia alcohólica','Agitación, temblor, alucinaciones o convulsiones tras suspender consumo requieren tratamiento dirigido.'],['Estado postictal','Debe mejorar progresivamente; una duración inusual obliga a buscar status no convulsivo u otra causa.'],['Deshidratación','Hipovolemia e hipoperfusión pueden producir delirium y coexistir con trastornos electrolíticos.'],['Alteración hidroelectrolítica moderada','Cambios de sodio, calcio o magnesio pueden contribuir, especialmente con otros precipitantes.'],['Hiperglucemia','La hiperosmolaridad o cetoacidosis pueden alterar conciencia y producir deshidratación.'],['Uremia','La acumulación de toxinas urémicas causa encefalopatía y puede acompañarse de alteraciones metabólicas.'],['Demencia con delirium superpuesto','Un cambio agudo sobre deterioro basal requiere buscar precipitantes orgánicos y no atribuirlo a demencia.']
]);
const contextual=diffs(5,[
['Encefalopatía hepática','Considerar en hepatopatía descompensada, precipitantes infecciosos, sangrado o fármacos.'],['Encefalopatía hipertensiva/PRES','Hipertensión grave con cefalea, convulsiones o síntomas visuales requiere evaluación neurológica.'],['TCE','Un traumatismo presenciado o no puede causar contusión, hemorragia o edema cerebral.'],['Hematoma subdural','Puede ser subagudo y sutil, especialmente en mayores, alcoholismo o anticoagulación.'],['Tumor cerebral','Puede presentarse con cefalea progresiva, focalidad, convulsiones o deterioro cognitivo.'],['Hidrocefalia','La obstrucción o falla de una derivación puede provocar deterioro agudo e hipertensión intracraneal.'],['Encefalopatía de Wernicke','Riesgo con alcoholismo, desnutrición o malabsorción; administrar tiamina temprana sin retrasar glucosa.'],['Hipotiroidismo grave/coma mixedematoso','Hipotermia, bradicardia, hipoventilación e hiponatremia apoyan el diagnóstico.'],['Tormenta tiroidea','Hipertermia, taquicardia, agitación y disfunción multiorgánica requieren tratamiento urgente.'],['Insuficiencia suprarrenal','Hipotensión, hiponatremia, hiperkalemia e hipoglucemia pueden acompañar el deterioro mental.'],['Intoxicación anticolinérgica','Midriasis, piel seca, retención urinaria, hipertermia y delirium orientan el toxidrome.'],['Intoxicación simpaticomimética','Agitación, hipertensión, taquicardia, diaforesis e hipertermia son claves.'],['Intoxicación por sedantes/hipnóticos','Depresión del SNC y respiratoria puede agravarse por combinaciones o acumulación.'],['Síndrome serotoninérgico','Clonus, hiperreflexia, agitación e hipertermia tras fármacos serotoninérgicos son orientadores.'],['Síndrome neuroléptico maligno','Rigidez, hipertermia, disautonomía y exposición a antagonistas dopaminérgicos requieren reconocimiento precoz.'],['Hipertermia/heat stroke','Temperatura elevada con disfunción neurológica es una emergencia de enfriamiento rápido.'],['Hipotermia','Puede causar bradicardia, hipoventilación, arritmias y depresión progresiva del sensorio.'],['Causa psiquiátrica primaria, solo después de excluir causa orgánica','Un cambio agudo inexplicado debe considerarse orgánico hasta completar una evaluación segura.']
]);

const complementaryStudies=studies([
['Glucemia capilar','Precozmente en prácticamente todo paciente con alteración aguda del sensorio.','Detectar hipoglucemia o hiperglucemia marcada.','Un valor anormal requiere tratamiento y recontrol; la respuesta aporta información sin excluir causas coexistentes.'],
['Hemograma','Cuando se evalúan infección, sangrado, anemia o enfermedad sistémica.','Anemia, leucocitosis y alteraciones plaquetarias.','Interpretar con clínica; resultados normales no excluyen infección grave.'],
['Electrolitos y función renal','En cuadros moderados/graves, pérdidas, fármacos o enfermedad renal.','Na, K, Cl, bicarbonato, urea y creatinina.','Identifica trastornos osmóticos, acidosis, uremia y riesgo de acumulación farmacológica.'],
['Calcio, magnesio y fósforo','Según gravedad y contexto, especialmente convulsiones o arritmias.','Alteraciones que expliquen excitabilidad neuromuscular o cardíaca.','Corregir de forma dirigida y relacionar con función renal, nutrición y fármacos.'],
['Función hepática','Ante hepatopatía, toxicidad o enfermedad sistémica.','Patrón de lesión, colestasis y síntesis hepática.','Apoya descompensación hepática, pero la encefalopatía es un diagnóstico clínico integrado.'],
['Gasometría','Ante hipoventilación, enfermedad respiratoria, shock o alteración metabólica.','Hipercapnia, hipoxemia, acidosis y compensaciones.','Define necesidad de soporte ventilatorio y gravedad metabólica.'],
['Lactato','En shock, sepsis, convulsión prolongada o intoxicaciones seleccionadas.','Hipoperfusión o metabolismo anaerobio.','La tendencia y el contexto son más útiles que un valor aislado.'],
['ECG','En casi todo cuadro con posible arritmia, tóxico o alteración electrolítica.','Arritmias, isquemia, QT/QRS y pistas toxicológicas o metabólicas.','Puede guiar tratamiento inmediato y monitorización.'],
['TC de cráneo sin contraste','Ante focalidad, trauma, anticoagulación, cefalea de alarma, deterioro inexplicado o sospecha hemorrágica.','Hemorragia, masa, hidrocefalia, edema o lesión traumática.','Una TC normal no excluye ACV temprano, encefalitis, status ni otras causas.'],
['Angio-TC cerebral/cervical','Ante sospecha de oclusión de gran vaso u otra patología vascular según protocolo.','Oclusión arterial, disección u otra lesión vascular.','Define elegibilidad y estrategia de reperfusión o intervención.'],
['Punción lumbar','Ante sospecha de meningitis, encefalitis o HSA seleccionada cuando sea segura.','Citología, glucosa, proteínas, cultivos/PCR y sangre según indicación.','No debe retrasar antimicrobianos o antiviral necesarios; valorar contraindicaciones.'],
['EEG','Ante status no convulsivo, alteración persistente postconvulsión o encefalopatía inexplicada.','Actividad ictal, patrones epileptiformes o encefalopatía.','Permite tratar status oculto y caracterizar disfunción cerebral.'],
['Tóxicos dirigidos','Cuando historia, escena o toxidrome sugieren una exposición concreta.','Sustancia o consecuencia tratable relevante.','Evitar paneles indiscriminados; un resultado negativo no descarta todos los tóxicos.'],
['Nivel de alcohol','Cuando modifica interpretación, observación o decisiones.','Concentración de etanol.','Un resultado positivo no demuestra causalidad única ni excluye lesión intracraneal.'],
['CO-oximetría/carboxihemoglobina','Ante exposición probable a monóxido de carbono.','Carboxihemoglobina y dishemoglobinas.','Interpretar según tiempo y oxígeno previo; la gravedad clínica guía tratamiento.'],
['Cultivos y estudios infecciosos dirigidos','Cuando infección o sepsis es probable.','Hemocultivos, orina, imágenes o muestras según foco.','Obtener sin retrasar tratamiento tiempo-dependiente y ajustar luego según resultados.']
]);

function createAlteredMentalStatusBaseContent():Omit<ClinicalApproachContent,'decisionTree'|'relatedContent'>{
return {
version:1,
presentation:richText(
{kind:'paragraph',text:'La alteración aguda del sensorio es un síndrome, no un diagnóstico.'},
{kind:'paragraph',text:'Puede manifestarse como:'},{kind:'bullet',items:['somnolencia','estupor','coma','confusión','desorientación','agitación','delirium','conducta anormal','déficit de atención','respuesta inapropiada','deterioro cognitivo agudo']},
{kind:'paragraph',text:'La prioridad inicial es determinar:'},{kind:'bullet',items:['¿Está protegida la vía aérea?','¿Existe hipoxia o ventilación inadecuada?','¿Existe shock o hipoperfusión?','¿Cuál es la glucemia?','¿Hay focalidad neurológica?','¿Hay signos de herniación?','¿Hubo convulsión o puede existir status no convulsivo?','¿Hay infección del SNC o sepsis?','¿Existe intoxicación?','¿Hay un trastorno metabólico grave?','¿Hay trauma?','¿Existe una causa reversible que debe tratarse antes de completar estudios?']},
{kind:'paragraph',text:'No atribuir el cuadro a alcohol, drogas, demencia o enfermedad psiquiátrica sin excluir primero causas orgánicas graves.'},
{kind:'paragraph',text:'El diagnóstico debe integrar:'},{kind:'bullet',items:['ABCDE','Glasgow y tendencia','pupilas','focalidad','glucemia','signos vitales','oxigenación y ventilación','temperatura','contexto clínico','medicamentos y tóxicos','laboratorio','neuroimagen','respuesta a intervenciones']}
),
initialAssessment:richText(
{kind:'heading',text:'A — Vía aérea'},{kind:'paragraph',text:'Evaluar capacidad de hablar, reflejos protectores, secreciones o vómitos, ronquido o gorgoteo, trauma y riesgo de aspiración.'},{kind:'paragraph',text:'Considerar vía aérea definitiva si existe:'},{kind:'bullet',items:['apnea','incapacidad para proteger la vía aérea','ventilación inadecuada','hipoxemia refractaria','deterioro progresivo','status convulsivo con compromiso respiratorio','necesidad de procedimiento o traslado con alto riesgo']},{kind:'paragraph',text:'No usar un número aislado de Glasgow como único criterio de intubación; integrar protección de vía aérea, ventilación, trayectoria clínica y contexto.'},
{kind:'heading',text:'B — Respiración'},{kind:'paragraph',text:'Evaluar FR, SpO2, patrón respiratorio, auscultación, trabajo respiratorio y signos de hipoventilación. Considerar hipercapnia como causa de alteración del sensorio y utilizar gasometría cuando sea relevante.'},
{kind:'heading',text:'C — Circulación'},{kind:'paragraph',text:'Evaluar FC, PA/PAM, ritmo, perfusión, relleno capilar, temperatura periférica, diuresis y shock. La hipoperfusión cerebral puede causar alteración mental incluso antes de hipotensión profunda.'},
{kind:'heading',text:'D — Neurológico'},{kind:'paragraph',text:'Evaluar inmediatamente:'},{kind:'bullet',items:['Glasgow','pupilas y simetría','respuesta motora','focalidad','lenguaje','signos meníngeos cuando corresponda','convulsiones','signos de trauma','glucemia capilar']},{kind:'paragraph',text:'La glucemia debe obtenerse precozmente porque la hipoglucemia es una causa reversible y tiempo-dependiente.'},
{kind:'heading',text:'E — Exposición'},{kind:'paragraph',text:'Buscar:'},{kind:'bullet',items:['fiebre o hipotermia','trauma','lesiones cutáneas','petequias o púrpura','marcas de inyección','parches transdérmicos','toxidromes','rigidez','signos de hepatopatía','edema','deshidratación']}
),
lifeThreats:richText({kind:'paragraph',text:'Prioridades vitales y tiempo-dependientes:'},{kind:'bullet',items:['hipoglucemia','hipoxia','hipercapnia grave','shock','ACV isquémico','hemorragia intracraneal','hemorragia subaracnoidea','herniación cerebral','status epiléptico convulsivo','status epiléptico no convulsivo','meningitis bacteriana','encefalitis','sepsis','intoxicación por opioides','intoxicación por monóxido de carbono','sobredosis de sedantes','intoxicación por anticolinérgicos o simpaticomiméticos','alteraciones graves de sodio','hiper o hipoglucemia grave','encefalopatía urémica','insuficiencia hepática o hiperamonemia','crisis hipertensiva con encefalopatía o PRES','TCE','hipotermia o hipertermia','déficit de tiamina en paciente de riesgo']}),
anamnesis,physicalExam,
differentialDiagnosis:{lifeThreatening,common,contextual},
complementaryStudies,
initialTreatment:richText(
{kind:'heading',text:'Principios generales'},{kind:'paragraph',text:'Realizar ABCDE simultáneamente con el diagnóstico y tratar de inmediato las causas reversibles.'},
{kind:'heading',text:'Hipoglucemia y tiamina'},{kind:'paragraph',text:'Tratar la hipoglucemia inmediatamente con glucosa IV si hay acceso o glucagón cuando corresponda. Recontrolar glucemia y buscar la causa.'},{kind:'paragraph',text:'En pacientes con riesgo de déficit —alcoholismo crónico, desnutrición o malabsorción— administrar tiamina tempranamente. No retrasar glucosa necesaria por esperar tiamina.'},
{kind:'heading',text:'Opioides'},{kind:'paragraph',text:'Si existe depresión respiratoria compatible, administrar naloxona titulada al objetivo de restaurar ventilación adecuada, no necesariamente despertar completamente. Considerar recurrencia según la duración del opioide.'},
{kind:'heading',text:'Oxígeno y ventilación'},{kind:'paragraph',text:'Corregir hipoxemia y ventilar si la hipoventilación o hipercapnia compromete la conciencia.'},
{kind:'heading',text:'Convulsiones y status'},{kind:'paragraph',text:'Tratar status convulsivo con benzodiazepina de primera línea y continuar el algoritmo anticonvulsivante según protocolo. Si no recupera conciencia como se espera, considerar status no convulsivo y EEG.'},
{kind:'heading',text:'ACV'},{kind:'paragraph',text:'Activar circuito de ACV, determinar última vez normal, obtener neuroimagen urgente y evaluar elegibilidad para reperfusión según protocolos.'},
{kind:'heading',text:'Hemorragia intracraneal y herniación'},{kind:'paragraph',text:'Controlar vía aérea, oxigenación y perfusión; revertir anticoagulación cuando corresponda y coordinar neurocirugía. Usar terapia hiperosmolar ante hipertensión intracraneal o herniación según protocolo. Evitar hiperventilación profiláctica; puede emplearse brevemente como puente ante herniación inminente.'},
{kind:'heading',text:'Meningitis, encefalitis y sepsis'},{kind:'paragraph',text:'Si la sospecha de meningitis o encefalitis es alta, obtener cultivos cuando no retrasen y administrar antimicrobianos empíricos tempranos. Añadir antiviral empírico cuando encefalitis herpética sea plausible. No retrasar tratamiento necesario por punción lumbar o imagen.'},{kind:'paragraph',text:'Ante sepsis, seguir el abordaje Sepsis y tratar el foco.'},
{kind:'heading',text:'Alteraciones metabólicas y térmicas'},{kind:'paragraph',text:'Corregir alteraciones del sodio según gravedad, síntomas, cronicidad y protocolo. La convulsión o coma por hiponatremia grave puede requerir solución hipertónica; evitar correcciones excesivamente rápidas.'},{kind:'paragraph',text:'En monóxido de carbono indicar oxígeno de alta concentración y evaluar oxigenoterapia hiperbárica según gravedad y contexto. En heat stroke realizar enfriamiento activo rápido y soporte orgánico; en hipotermia, recalentamiento según gravedad y monitorización.'},
{kind:'heading',text:'Agitación'},{kind:'paragraph',text:'Buscar y tratar primero hipoxia, hipoglucemia, dolor, retención urinaria, abstinencia, intoxicación y delirium. Utilizar contención verbal o ambiental y farmacológica solo cuando sea necesaria para seguridad y diagnóstico o tratamiento. Evitar sedación que oculte deterioro sin monitorización apropiada.'}
),
reassessment:richText({kind:'paragraph',text:'Después de cada intervención reevaluar:'},{kind:'bullet',items:['vía aérea','FR y SpO2','ventilación','PA/PAM','perfusión','glucemia','Glasgow','pupilas','focalidad','temperatura','convulsiones','agitación','respuesta a naloxona, glucosa o anticonvulsivantes','laboratorio','evolución temporal']},{kind:'paragraph',text:'Preguntas clave:'},{kind:'bullet',items:['¿Mejoró con glucosa?','¿Mejoró la ventilación?','¿Apareció focalidad?','¿Persiste coma tras convulsión?','¿Hay status no convulsivo?','¿Hay infección?','¿Hay un tóxico de acción prolongada?','¿Hay deterioro progresivo?','¿Necesita UCI, neurocirugía o toxicología?']}),
disposition:{
discharge:p('Solo si la causa fue identificada y corregida, recuperó completamente su estado basal, permanece estable, no presenta signos de alarma, cuenta con seguimiento seguro y no necesita observación adicional.'),
admission:p('Indicar ante delirium persistente, infección, alteraciones metabólicas, intoxicaciones que requieren observación, deterioro funcional o causa no completamente resuelta.'),
criticalCare:p('Indicar ante coma, vía aérea avanzada, status, shock, insuficiencia respiratoria, hipertensión intracraneal, ACV grave, intoxicación severa, trastorno metabólico grave o deterioro progresivo.'),
referral:p('Solicitar neurología, neurocirugía, toxicología, infectología, terapia intensiva, psiquiatría solo después de excluir causas orgánicas relevantes, u otras especialidades según etiología.')
},
warningsAndInstructions:richText({kind:'paragraph',text:'Indicar retorno o reevaluación urgente ante:'},{kind:'bullet',items:['nueva confusión','somnolencia','pérdida de conciencia','convulsión','debilidad','alteración del habla','cefalea intensa o progresiva','fiebre','rigidez cervical','vómitos repetidos','disnea','dolor torácico','conducta anormal','caída o trauma','hipoglucemia recurrente','empeoramiento general']}),
commonErrors:richText({kind:'bullet',items:['Llamar “intoxicado” al paciente sin excluir causas graves.','Atribuir el cuadro a demencia basal sin confirmar cambio agudo.','Olvidar glucemia precoz.','Retrasar glucosa por esperar tiamina.','Usar Glasgow aislado como única indicación de intubación.','No buscar hipercapnia.','No registrar última vez conocido normal.','Omitir focalidad neurológica.','Asumir que un estado postictal prolongado siempre es benigno.','No considerar status no convulsivo.','Retrasar antibióticos por esperar punción lumbar.','No considerar encefalitis.','Sedar agitación antes de buscar causas reversibles.','Despertar completamente con naloxona en vez de titular a ventilación cuando no es necesario.','Interpretar alcohol positivo como diagnóstico único.','Pedir panel toxicológico indiscriminado y confiar ciegamente en él.','Corregir sodio demasiado rápido.','No reevaluar Glasgow y pupilas.','Dar alta sin retorno al estado basal o explicación segura.','Diagnosticar causa psiquiátrica primaria antes de excluir etiología orgánica.']}),
clinicalPearls:richText({kind:'bullet',items:['Alteración del sensorio es un síndrome, no un diagnóstico.','La glucemia es parte del examen neurológico inicial.','“Última vez normal” es una pregunta crítica.','La tendencia del Glasgow vale más que un número aislado.','Pupilas, focalidad y evolución temporal orientan rápidamente.','Hipoxia, hipercapnia, hipoglucemia y shock son causas reversibles prioritarias.','Un alcohol positivo no descarta hemorragia intracraneal.','No retrasar glucosa por tiamina.','Naloxona se titula principalmente a ventilación adecuada.','La ausencia de convulsiones visibles no excluye status.','Persistencia inexplicada tras una convulsión debe hacer pensar en EEG.','Delirium suele ser multifactorial.','En adultos mayores, infección puede presentarse sin fiebre llamativa.','Un fármaco habitual puede convertirse en tóxico por falla renal o interacciones.','La TC normal no excluye todas las causas neurológicas.','En sospecha de meningitis, tratamiento y diagnóstico deben avanzar en paralelo.','La agitación puede ser manifestación de hipoxia o hipoglucemia.','Causa psiquiátrica es diagnóstico de exclusión en un cambio agudo inexplicado.','La respuesta a una intervención también aporta información diagnóstica.','Reevaluar repetidamente evita perder un ACV, herniación, status o deterioro sistémico.']})
};}

const nodeTitles:Array<[DecisionTree['nodes'][number]['type'],string,string]>=[
['start','Paciente con alteración aguda del sensorio','Iniciar evaluación inmediata y simultánea de estabilización y etiología.'],
['action','ABCDE + monitorización + glucemia inmediata','Proteger funciones vitales, monitorizar tendencias y medir glucemia sin demora.'],
['question','¿Hipoglucemia?','Interpretar glucemia y contexto clínico.'],
['action','Administrar glucosa y reevaluar','Tratar inmediatamente, recontrolar glucemia y buscar la causa.'],
['question','¿Hipoxia o ventilación inadecuada?','Evaluar SpO2, patrón, trabajo respiratorio y posible hipercapnia.'],
['action','Corregir oxigenación/ventilación','Aportar oxígeno y soporte ventilatorio según fisiología.'],
['question','¿Shock o hipoperfusión?','Integrar presión, perfusión periférica, diuresis y tendencia.'],
['action','Reanimar y tratar mecanismo del shock','Restaurar perfusión y controlar la causa sin demorar la evaluación neurológica.'],
['question','¿Hay focalidad o inicio neurológico brusco?','Buscar déficit focal y precisar última vez conocido normal.'],
['action','Activar evaluación urgente de ACV/lesión estructural','Obtener neuroimagen y activar el circuito tiempo-dependiente.'],
['question','¿Signos de herniación o deterioro neurológico rápido?','Buscar anisocoria, posturas anormales y caída progresiva del Glasgow.'],
['action','Medidas de neuroprotección y neurocirugía urgente','Evitar hipoxia e hipotensión y aplicar medidas puente según protocolo.'],
['question','¿Convulsión activa o recurrente?','Reconocer actividad manifiesta o episodios repetidos sin recuperación.'],
['action','Tratar status convulsivo','Administrar benzodiazepina y continuar algoritmo anticonvulsivante.'],
['question','¿Persiste alteración sin recuperación esperada?','Comparar con el curso postictal esperado y otras intervenciones.'],
['action','Considerar EEG / status no convulsivo','Solicitar EEG y tratar según hallazgos y contexto.'],
['question','¿Fiebre, meningismo o infección del SNC probable?','Integrar clínica, inmunosupresión y presentación incompleta.'],
['action','Antimicrobianos/antiviral empírico según sospecha','No retrasar tratamiento necesario por punción lumbar o imagen.'],
['question','¿Sepsis o infección sistémica probable?','Buscar foco, hipoperfusión y disfunción orgánica.'],
['action','Seguir abordaje de sepsis y tratar foco','Tomar muestras sin demorar antimicrobianos y reanimación indicados.'],
['question','¿Toxidrome o exposición probable?','Usar historia, escena y examen para orientar tóxicos específicos.'],
['question','¿Depresión respiratoria compatible con opioides?','Valorar ventilación, pupilas y exposición.'],
['action','Naloxona titulada a ventilación','Restaurar ventilación adecuada y vigilar recurrencia.'],
['question','¿Monóxido de carbono probable?','Considerar ambiente cerrado, combustión y múltiples afectados.'],
['action','Oxígeno de alta concentración','Iniciar oxígeno y valorar tratamiento hiperbárico según gravedad.'],
['action','Manejo toxicológico dirigido y soporte','Aplicar medidas y antídotos específicos cuando estén indicados.'],
['question','¿Trastorno metabólico/electrolítico grave?','Revisar sodio, glucosa, renal, hepático, ácido-base y temperatura.'],
['action','Corregir alteración específica de forma controlada','Tratar según gravedad y cronicidad evitando correcciones peligrosas.'],
['question','¿Persiste causa no explicada?','Revisar datos, evolución y diagnósticos aún no evaluados.'],
['action','Ampliar estudio: TC/LP/EEG/laboratorio según contexto','Seleccionar estudios dirigidos sin retrasar tratamientos tiempo-dependientes.'],
['question','¿Recuperó estado basal y permanece estable?','Confirmar recuperación sostenida, causa segura y ausencia de alarmas.'],
['warning','No atribuir a alcohol, demencia o psiquiatría sin excluir causa orgánica','Mantener búsqueda sistemática de etiologías graves y reversibles.'],
['action','Reevaluación seriada neurológica y sistémica','Repetir ABCDE, Glasgow, pupilas, focalidad, glucemia y respuesta terapéutica.'],
['disposition','Definir alta, internación, UCI o interconsulta','Elegir destino según etiología, estabilidad, recuperación y recursos necesarios.']
];
const alteredMentalStatusDecisionTree:DecisionTree={
rootNodeId:'altered-sensorium-n01',
nodes:nodeTitles.map(([type,title,description],i)=>({id:`altered-sensorium-n${String(i+1).padStart(2,'0')}`,type,title,description})),
edges:[
['01','01','02','Iniciar'],['02','02','03','Glucemia'],['03','03','04','Sí'],['04','03','05','No'],['05','04','05','Tras corregir'],
['06','05','06','Sí'],['07','05','07','No'],['08','06','07','Reevaluar'],['09','07','08','Sí'],['10','07','09','No'],['11','08','09','Tras reanimar'],
['12','09','10','Sí'],['13','09','11','No'],['14','10','11','Continuar evaluación'],['15','11','12','Sí'],['16','11','13','No'],['17','12','13','Tras medidas urgentes'],
['18','13','14','Sí'],['19','13','15','No'],['20','14','15','Tras tratamiento'],['21','15','16','Evaluar recuperación y EEG'],['22','16','17','Continuar'],
['23','17','18','Sí'],['24','17','19','No'],['25','18','19','Tras tratamiento inicial'],['26','19','20','Sí'],['27','19','21','No'],['28','20','21','Continuar'],
['29','21','22','Evaluar opioides'],['30','22','23','Sí'],['31','22','24','No'],['32','23','24','Tras naloxona'],['33','24','25','Sí'],['34','24','26','No'],
['35','25','26','Continuar'],['36','26','27','Reevaluar'],['37','27','28','Sí'],['38','27','29','No'],['39','28','29','Tras corrección'],
['40','29','30','Sí'],['41','29','32','No / antes de atribuir'],['42','30','31','Tras estudio ampliado'],['43','32','31','Excluir causa orgánica'],
['44','31','33','Reevaluar estabilidad'],['45','33','34','Estable o destino definido'],['46','30','33','Reevaluación paralela']
].map(([n,from,to,label])=>({id:`altered-sensorium-e${n}`,from:`altered-sensorium-n${from}`,to:`altered-sensorium-n${to}`,label}))
};

export function createAlteredMentalStatusClinicalApproach(userId:string):ClinicalApproach{
const timestamp=new Date().toISOString();
const content:ClinicalApproachContent={...createAlteredMentalStatusBaseContent(),decisionTree:alteredMentalStatusDecisionTree,relatedContent:[]};
const validation=validateDecisionTree(content.decisionTree);
if(validation.errors.length>0||validation.warnings.length>0){const issues=[...validation.errors,...validation.warnings].map(issue=>issue.message).join(' ');throw new Error(`El fixture de Alteración aguda del sensorio contiene un árbol inválido: ${issues}`);}
return{id:crypto.randomUUID(),userId,title:ALTERED_MENTAL_STATUS_APPROACH_TITLE,description:ALTERED_MENTAL_STATUS_APPROACH_DESCRIPTION,categoryId:null,category:null,content,createdAt:timestamp,updatedAt:timestamp,status:'complete'};
}
