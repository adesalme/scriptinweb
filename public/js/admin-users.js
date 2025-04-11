document.addEventListener('DOMContentLoaded', function() {
    // Initialisation de Socket.IO
    const socket = io({
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 3
    });

    // Fonction pour basculer les droits d'administrateur d'un utilisateur
    window.toggleAdmin = async function(userId, isAdmin) {
        try {
            const response = await fetch(`/admin/users/${userId}/toggle-admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la modification des droits');
            }

            // Afficher un message de succès
            showAlert('Les droits d\'administrateur ont été modifiés avec succès', 'success');
        } catch (error) {
            console.error('Erreur:', error);
            showAlert(error.message, 'danger');
            
            // Remettre la case à cocher dans son état précédent
            const checkbox = document.getElementById(`isAdmin_${userId}`);
            checkbox.checked = !isAdmin;
        }
    };

    // Fonction pour supprimer un utilisateur
    window.deleteUser = async function(userId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            return;
        }

        try {
            const response = await fetch(`/admin/users/${userId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erreur lors de la suppression de l\'utilisateur');
            }

            // Supprimer la ligne du tableau
            const row = document.querySelector(`tr[data-user-id="${userId}"]`);
            if (row) {
                row.remove();
            }

            // Afficher un message de succès
            showAlert('L\'utilisateur a été supprimé avec succès', 'success');
        } catch (error) {
            console.error('Erreur:', error);
            showAlert(error.message, 'danger');
        }
    };

    // Fonction pour afficher une alerte
    function showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) {
            const container = document.createElement('div');
            container.id = 'alertContainer';
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.right = '20px';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }

        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.role = 'alert';
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        document.getElementById('alertContainer').appendChild(alert);

        // Supprimer l'alerte après 5 secondes
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}); 