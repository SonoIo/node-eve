import context from 'context-utils';
import LoadingScreenView from '../../../lib/views/components/LoadingScreenView';

const loadingScreenView = new LoadingScreenView({
	template: require('../../../templates/components/loading_screen.html')
});
context.viewstack.pushView(loadingScreenView);

const wait = async (seconds) => new Promise(resolve => setTimeout(() => resolve(), seconds * 1000));

const execute = async () => {
	await wait(1);
	loadingScreenView.show();
	await wait(2);
	loadingScreenView.hide();
}

execute();
