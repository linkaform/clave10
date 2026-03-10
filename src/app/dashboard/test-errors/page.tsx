"use client"
import GlobalError from '../../global-error';

export default function TestErrors() {

    return <GlobalError error={new Error('Test')} reset={() => {}} />
}
