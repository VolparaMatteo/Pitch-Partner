from app import db
from app.models import Notification

class NotificationService:
    """Service per creare notifiche automatiche per eventi del Project Management"""

    @staticmethod
    def notify_task_assigned(task):
        """Notifica quando un task viene assegnato"""
        if not task.assegnato_a_type or not task.assegnato_a_id:
            return None

        return Notification.create_notification(
            user_type=task.assegnato_a_type,
            user_id=task.assegnato_a_id,
            tipo='task_assegnato',
            titolo=f'Nuovo task assegnato: {task.titolo}',
            messaggio=f'Ti è stato assegnato un task nel progetto "{task.project.titolo}". Scadenza: {task.data_scadenza.strftime("%d/%m/%Y %H:%M") if task.data_scadenza else "Non specificata"}',
            link_url=f'/projects/{task.project_id}#task-{task.id}',
            oggetto_type='task',
            oggetto_id=task.id,
            priorita=task.priorita
        )

    @staticmethod
    def notify_task_completed(task):
        """Notifica al club quando uno sponsor completa un task"""
        if task.creato_da_type == 'club':
            return Notification.create_notification(
                user_type='club',
                user_id=task.creato_da_id,
                tipo='task_completato',
                titolo=f'Task completato: {task.titolo}',
                messaggio=f'Il task "{task.titolo}" è stato completato da {task.get_assignee_name()}',
                link_url=f'/club/projects/{task.project_id}#task-{task.id}',
                oggetto_type='task',
                oggetto_id=task.id,
                priorita='normale'
            )
        return None

    @staticmethod
    def notify_project_update(update):
        """Notifica sponsor quando club pubblica un update"""
        project = update.project

        return Notification.create_notification(
            user_type='sponsor',
            user_id=project.sponsor_id,
            tipo='project_update',
            titolo=f'Aggiornamento progetto: {update.titolo}',
            messaggio=update.contenuto[:200] + ('...' if len(update.contenuto) > 200 else ''),
            link_url=f'/sponsor/projects/{project.id}#update-{update.id}',
            oggetto_type='update',
            oggetto_id=update.id,
            priorita='alta' if update.pin_in_alto else 'normale'
        )

    @staticmethod
    def notify_milestone_completed(milestone):
        """Notifica sponsor quando una milestone è completata"""
        project = milestone.project

        return Notification.create_notification(
            user_type='sponsor',
            user_id=project.sponsor_id,
            tipo='milestone_raggiunto',
            titolo=f'Milestone raggiunto: {milestone.titolo}',
            messaggio=f'Il traguardo "{milestone.titolo}" del progetto "{project.titolo}" è stato completato!',
            link_url=f'/sponsor/projects/{project.id}#milestone-{milestone.id}',
            oggetto_type='milestone',
            oggetto_id=milestone.id,
            priorita='alta'
        )

    @staticmethod
    def notify_deadline_approaching(task, days_left):
        """Notifica scadenza imminente (7, 3, 1 giorni prima)"""
        if not task.assegnato_a_type or not task.assegnato_a_id:
            return None

        urgency_map = {
            7: 'normale',
            3: 'alta',
            1: 'urgente'
        }

        return Notification.create_notification(
            user_type=task.assegnato_a_type,
            user_id=task.assegnato_a_id,
            tipo='scadenza_imminente',
            titolo=f'Scadenza imminente: {task.titolo}',
            messaggio=f'Il task "{task.titolo}" scade tra {days_left} giorno{"i" if days_left > 1 else ""}. Assicurati di completarlo in tempo!',
            link_url=f'/projects/{task.project_id}#task-{task.id}',
            oggetto_type='task',
            oggetto_id=task.id,
            priorita=urgency_map.get(days_left, 'normale')
        )

    @staticmethod
    def notify_comment_added(comment):
        """Notifica quando viene aggiunto un commento a un task"""
        task = comment.task

        # Notifica all'assegnatario del task se il commento non è suo
        if task.assegnato_a_type and task.assegnato_a_id:
            if not (comment.autore_type == task.assegnato_a_type and comment.autore_id == task.assegnato_a_id):
                return Notification.create_notification(
                    user_type=task.assegnato_a_type,
                    user_id=task.assegnato_a_id,
                    tipo='commento',
                    titolo=f'Nuovo commento su: {task.titolo}',
                    messaggio=f'{comment.get_author_name()} ha commentato: "{comment.contenuto[:100]}..."',
                    link_url=f'/projects/{task.project_id}#task-{task.id}-comment-{comment.id}',
                    oggetto_type='comment',
                    oggetto_id=comment.id,
                    priorita='normale'
                )
        return None

    @staticmethod
    def notify_status_changed(project, old_status, new_status):
        """Notifica sponsor quando cambia lo stato del progetto"""
        status_labels = {
            'pianificazione': 'In Pianificazione',
            'in_corso': 'In Corso',
            'in_pausa': 'In Pausa',
            'completato': 'Completato',
            'archiviato': 'Archiviato'
        }

        return Notification.create_notification(
            user_type='sponsor',
            user_id=project.sponsor_id,
            tipo='cambio_stato',
            titolo=f'Cambio stato progetto: {project.titolo}',
            messaggio=f'Il progetto è passato da "{status_labels.get(old_status, old_status)}" a "{status_labels.get(new_status, new_status)}"',
            link_url=f'/sponsor/projects/{project.id}',
            oggetto_type='project',
            oggetto_id=project.id,
            priorita='alta' if new_status == 'completato' else 'normale'
        )

    @staticmethod
    def check_upcoming_deadlines():
        """Cron job: controlla tasks con scadenze imminenti (da eseguire giornalmente)"""
        from datetime import datetime, timedelta
        from app.models import ProjectTask

        now = datetime.utcnow()
        notifications_created = []

        # Check per 7, 3, 1 giorni
        for days in [7, 3, 1]:
            target_date = now + timedelta(days=days)

            # Trova tasks che scadono tra esattamente N giorni
            tasks = ProjectTask.query.filter(
                ProjectTask.stato != 'completato',
                ProjectTask.data_scadenza >= target_date,
                ProjectTask.data_scadenza < target_date + timedelta(days=1)
            ).all()

            for task in tasks:
                # Verifica se non è già stata inviata una notifica per questa scadenza
                existing = Notification.query.filter_by(
                    tipo='scadenza_imminente',
                    oggetto_type='task',
                    oggetto_id=task.id,
                    user_type=task.assegnato_a_type,
                    user_id=task.assegnato_a_id
                ).filter(
                    Notification.created_at >= now - timedelta(days=1)
                ).first()

                if not existing:
                    notif = NotificationService.notify_deadline_approaching(task, days)
                    if notif:
                        notifications_created.append(notif)

        return notifications_created
