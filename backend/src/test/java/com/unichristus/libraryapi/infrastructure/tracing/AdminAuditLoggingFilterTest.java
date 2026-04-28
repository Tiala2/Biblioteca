package com.unichristus.libraryapi.infrastructure.tracing;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;

class AdminAuditLoggingFilterTest {

    private final AdminAuditLoggingFilter filter = new AdminAuditLoggingFilter();
    private final FilterChain chain = mock(FilterChain.class);

    @Test
    void shouldContinueFilterChainForAdminMutationRequests() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/admin/books");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verifyNoMoreInteractions(chain);
    }

    @Test
    void shouldContinueFilterChainForNonAdminRequests() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/books");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verifyNoMoreInteractions(chain);
    }
}
