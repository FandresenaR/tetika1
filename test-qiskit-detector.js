/**
 * test-qiskit-detector.js
 * 
 * Script de test pour évaluer les détecteurs de code quantique,
 * en particulier le détecteur Qiskit pour le mode RAG.
 */

// Importer les modules nécessaires
const { enhanceQiskitCodeDetection } = require('./lib/qiskit-detector');
const { enhanceQuantumCodeDetection } = require('./lib/quantum-code-detector');
const { enhanceRagCodeDetection } = require('./lib/rag-code-fixer-v2');

// Exemples de code Qiskit pour les tests
const qiskitSimpleExample = `
Voici un exemple simple de circuit quantique avec Qiskit :

from qiskit import QuantumCircuit, transpile, assemble, Aer, execute
from qiskit.visualization import plot_bloch_vector

qc = QuantumCircuit(1)  # A single qubit circuit
qc.h[0] # Apply Hadamard gate to the qubit
qc.measure_all() # Measure all the qubits

simulator = Aer.get_backend('qasm_simulator') # Use a simulator
result = execute(qc, backend=simulator, shots=1000).result() # Execute the circuit 
count_result = result.get_counts(qc) # Get the counts
print(count_result) # Print the results
`;

const qiskitCompleteExample = `
# Exemple complet d'algorithme de téléportation quantique avec Qiskit

from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister, Aer, execute
from qiskit.visualization import plot_histogram

# Création des registres
qr = QuantumRegister(3, 'q')    # 3 qubits
crz = ClassicalRegister(1, 'crz')  # 1 bit classique pour la correction Z
crx = ClassicalRegister(1, 'crx')  # 1 bit classique pour la correction X
circuit = QuantumCircuit(qr, crz, crx)

# Préparation de l'état à téléporter (qubit 0)
circuit.h(qr[0])
circuit.z(qr[0])

# Création de l'intrication entre les qubits 1 et 2
circuit.h(qr[1])
circuit.cx(qr[1], qr[2])

# Téléportation
circuit.cx(qr[0], qr[1])
circuit.h(qr[0])
circuit.measure(qr[0], crz)
circuit.measure(qr[1], crx)

# Correction selon les résultats de mesure
circuit.z(qr[2]).c_if(crz, 1)
circuit.x(qr[2]).c_if(crx, 1)

# Exécution sur simulateur
simulator = Aer.get_backend('qasm_simulator')
job = execute(circuit, simulator, shots=1024)
result = job.result()
counts = result.get_counts(circuit)

print("Résultats de la téléportation :", counts)
# Affichage des résultats
plot_histogram(counts)
`;

const qiskitWithErrors = `
Voici un exemple de code Qiskit avec quelques erreurs de syntaxe :

from qiskit import QuantumCircuit
qc = QuantumCircuit([2])  # Erreur: devrait être QuantumCircuit(2)
qc.h[0]  # Erreur de syntaxe: devrait être qc.h(0)
qc.cx[0,1]  # Erreur: devrait être qc.cx(0,1)
result = execute(qc, Aer.get_backend('qasm_simulator')).result()
`;

// Fonction pour tester les différents détecteurs
function testDetectors() {
  console.log('====== TEST DE DÉTECTEURS DE CODE QUANTIQUE ======');
  
  // Test 1: Exemple simple avec enhanceQiskitCodeDetection
  console.log('\n1. Test de enhanceQiskitCodeDetection sur exemple simple:');
  const result1 = enhanceQiskitCodeDetection(qiskitSimpleExample);
  console.log(result1);
  
  // Test 2: Exemple complet avec enhanceQiskitCodeDetection
  console.log('\n2. Test de enhanceQiskitCodeDetection sur exemple complet:');
  const result2 = enhanceQiskitCodeDetection(qiskitCompleteExample);
  console.log(result2);
  
  // Test 3: Exemple avec erreurs avec enhanceQiskitCodeDetection
  console.log('\n3. Test de enhanceQiskitCodeDetection sur exemple avec erreurs:');
  const result3 = enhanceQiskitCodeDetection(qiskitWithErrors);
  console.log(result3);
  
  // Test 4: Exemple simple avec enhanceQuantumCodeDetection générique
  console.log('\n4. Test de enhanceQuantumCodeDetection sur exemple simple:');
  const result4 = enhanceQuantumCodeDetection(qiskitSimpleExample);
  console.log(result4);
  
  // Test 5: Exemple complet avec enhanceQuantumCodeDetection
  console.log('\n5. Test de enhanceQuantumCodeDetection sur exemple complet:');
  const result5 = enhanceQuantumCodeDetection(qiskitCompleteExample);
  console.log(result5);
  
  // Test 6: Détecteur RAG sur exemple simple 
  console.log('\n6. Test de enhanceRagCodeDetection sur exemple simple:');
  const result6 = enhanceRagCodeDetection(qiskitSimpleExample);
  console.log(result6);
  
  // Test 7: Test de la chaîne complète de détection (pipeline)
  console.log('\n7. Test du pipeline complet de détection:');
  let resultPipeline = qiskitWithErrors;
  resultPipeline = enhanceQiskitCodeDetection(resultPipeline);
  resultPipeline = enhanceQuantumCodeDetection(resultPipeline);
  resultPipeline = enhanceRagCodeDetection(resultPipeline);
  console.log(resultPipeline);
  
  console.log('\n====== FIN DES TESTS ======');
}

// Exécution des tests
testDetectors();