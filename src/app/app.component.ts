import {AfterContentChecked, Component, NgZone, Output} from '@angular/core';
import {LocalStorage} from "ngx-store";
import {WebstorableArray} from "ngx-store/lib/ngx-store.types";
import {noop} from "rxjs";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";

type Answer = {
	questionId: string,
	text: string,
	attachmentUrl?: string | null
};
// Header

// Feature-Policy: microphone 'self'

@Component({
	selector: 'app-root',
	template: `
		<!--The content below is only a placeholder and can be replaced.-->
		<div style="text-align:center" class="content">
			<h1>
				Welcome to {{title}}!
			</h1>
		</div>

		<ul>
			<li *ngFor="let q of this.questions">
				<h4>{{q.title}}</h4>

				<div class="d-flex">
					<textarea
						[(ngModel)]="answerFor(q.id).text"
						[ngModelOptions]="{updateOn:'blur'}"
					></textarea>

					<button type="button"
					        class="btn btn-outline-danger"
					        (click)="recordAnswer(q.id)"
					        [disabled]="q.id==recorderState.recording"
					        [class]="{'btn-danger':!(q.id==recorderState.recording), 'btn-outline-danger':q.id==recorderState.recording}">Record
					</button>
					<button type="button"
					        class="btn"
					        [class]="{'btn-outline-dark':!(q.id==recorderState.recording),'btn-dark':q.id==recorderState.recording}"
					        (click)="stopRecording()"
					        [disabled]="q.id!=recorderState.recording"
					>Speichern / Stop
					</button>

					<audio *ngIf="answerFor(q.id).attachmentUrl" [src]="getAudioUrl(q.id)" controls preload="auto"></audio>
					<button type="button"
					        class="btn"
					        *ngIf="answerFor(q.id).attachmentUrl"
					        (click)="deleteRecording(q.id)"
					>Aufnahme für diese Frage löschen
					</button>
				</div>
			</li>
		</ul>


		<pre>{{answers|json}}</pre>

		<button class="btn" (click)="resetAnswers()">Alle Antworten löschen</button>
	`,
	styles: []
})
export class AppComponent implements AfterContentChecked {

	constructor(
		private ngZone: NgZone,
		private _sanitizer: DomSanitizer) {
	}

	title = 'WebBefragung';

	questions = [
		{
			id: '1',
			title: 'Frage 1'
		},
		{
			id: '2',
			title: 'Frage 2'
		}
	];

	@Output()
	@LocalStorage({mutate: true})
	answers: WebstorableArray<Answer> = [] as unknown as WebstorableArray<Answer>;

	ngAfterContentChecked() {
		console.log(`save answers`);
		this.answers.save();
	}

	answerFor(id: string): Answer {
		if (!this.answers?.length)
			this.resetAnswers();

		let answer = this.answers.find(a => a.questionId == id);
		if (answer === undefined) {
			answer = {questionId: id, text: ''};
			if (id)
				this.answers.push(answer);
		}

		return answer;
	}

	resetAnswers() {
		this.answers = [] as unknown as WebstorableArray<Answer>;
	}

	async recordAnswer(id: string) {
		const mediaRecorder = await this.getMediaRecorder();

		if (mediaRecorder.state == 'recording')
			mediaRecorder.stop();

		mediaRecorder.ondataavailable = (e) => {
			this.recorderState.chunks.push(e.data);
		}

		mediaRecorder.start();
		console.log(mediaRecorder.state);
		console.log("recorder started");
		this.recorderState.recording = id;
	}

	getAudioUrl(id: string): SafeResourceUrl {
		return this._sanitizer.bypassSecurityTrustResourceUrl(this.answerFor(id).attachmentUrl as string);
	}

	async stopRecording() {
		const mediaRecorder = await this.getMediaRecorder();

		if (this.recorderState.recording) {
			mediaRecorder.onstop = () => {
				this.ngZone.run(async () => {
					const blob = new Blob(this.recorderState.chunks, {'type': 'audio/ogg; codecs=opus'});
					this.answerFor(this.recorderState.recording).attachmentUrl = await blobToDataURL(blob);

					//this.answerFor(this.recorderState.recording).attachmentUrl = URL.createObjectURL(blob);
					this.recorderState.recording = '';
					this.recorderState.chunks = [];
				});
			}
			mediaRecorder.stop();
		} else {
			mediaRecorder.onstop = noop;
			this.recorderState.recording = '';
			this.recorderState.chunks = [];
			mediaRecorder.stop();
		}
		console.log("recorder stopped");
	}

	recorderState: { chunks: Blob[]; recording: string } = {
		chunks: [],
		recording: '', // the question id that is recording at the moment
	}

	private mediaRecoder?: MediaRecorder = undefined;

	private async getMediaRecorder() {
		if (this.mediaRecoder == undefined) {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					channelCount: 1,
					sampleSize: 8
				}
			});
			this.mediaRecoder = new MediaRecorder(stream);
		}
		return this.mediaRecoder;
	}

	deleteRecording(id: string) {
		this.answerFor(id).attachmentUrl = undefined;
	}
}

function blobToDataURL(blob: Blob): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = _e => resolve(reader.result as string);
		reader.onerror = _e => reject(reader.error);
		reader.onabort = _e => reject(new Error("Read aborted"));
		reader.readAsDataURL(blob);
	});
}