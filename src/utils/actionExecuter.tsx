import { Page } from 'playwright';

export async function executeAction(action: any, page: Page) {
    console.log('Executing action:', action);

    switch (action.action) {
        case 'Click':
            if (action.element_description) {
                const elements = document.querySelectorAll('*');
                for (const element of elements) {
                    if (element.textContent?.includes(action.element_description)) {
                        if (element instanceof HTMLElement) {
                            element.click();
                            console.log('Clicked element:', element);
                            return;
                        }
                    }
                }
                console.error('Element not found:', action.element_description);
            }
            break;

        case 'Type':
            if (action.element_description && action.text_input) {
                const inputs = document.querySelectorAll('input, textarea');
                for (const input of inputs) {
                    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
                        if (input.placeholder?.includes(action.element_description) || input.name?.includes(action.element_description)) {
                            input.value = action.text_input;
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            console.log('Typed into element:', input);
                            return;
                        }
                    }
                }
                console.error('Input element not found:', action.element_description);
            }
            break;

        case 'Scroll':
            if (action.screen_location) {
                window.scrollTo({
                    top: action.screen_location.y,
                    behavior: 'smooth'
                });
                console.log('Scrolled to:', action.screen_location.y);
            }
            break;

        case 'Wait':
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
            console.log('Waited for 5 seconds');
            break;

        case 'GoBack':
            window.history.back();
            console.log('Navigated back');
            break;

        case 'Home':
            window.location.href = 'http://localhost:3000/';
            console.log('Navigated to home page');
            break;

        default:
            console.warn('Unknown action:', action.action);
    }
}