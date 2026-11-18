package com.warrantrack.exception;

public class InvalidStateTransitionException extends RuntimeException {
    public InvalidStateTransitionException(String message) {
        super(message);
    }
    public InvalidStateTransitionException(String from, String to) {
        super(String.format("Invalid status transition from %s to %s", from, to));
    }
}

